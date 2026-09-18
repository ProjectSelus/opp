import * as admin from 'firebase-admin';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import {
  Issue,
  FormalManifestation,
  AuditEvent,
  IssueStatus,
  FormalManifestationStatus,
  sanitizeText,
  generateSearchTokens,
  expandTokensWithSynonyms,
  findDuplicateCandidates,
  computeMergedIssue,
  computeSplitIssue,
  IssueComment,
  evaluateCommentRisk,
  processCommentReport,
  generateManifestationCode,
  validateSingleAdhesionPerUser,
  processManifestationWithdrawal,
  CURRENT_DOCUMENT_TEMPLATE_VERSION,
  Agency,
  computeIssueRouting,
  verifyAgencyChannel,
  DispatchStatus,
  groupManifestationsForDispatch,
  buildAgencyDispatchEmail,
  buildCitizenConfirmationEmail,
  buildIndividualAdhesionEmail,
  processAgencyResponse,
  processInboundEmail,
  extractCorrelationIdentifiers,
  InboundEmailPayload,
  computeResolutionConsensus,
  CitizenResolutionVote,
  ResolutionVoteOption
} from '@opp/shared';
import { FirestoreIssueRepository } from './repositories/firestore-issue-repository.js';
import { FirestoreTokenSearchProvider } from './providers/token-search-provider.js';
import { HtmlDocumentProvider } from './providers/html-document-provider.js';
import { GeminiAIProvider } from './providers/gemini-ai-provider.js';
import { SmtpMailProvider } from './providers/smtp-mail-provider.js';

// Inicializa Firebase Admin se ainda não inicializado
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const issueRepo = new FirestoreIssueRepository();
const searchProvider = new FirestoreTokenSearchProvider(issueRepo);
const mailProvider = new SmtpMailProvider();

/**
 * Endpoint de busca estrutural de Issues (Busca-first - Seção 12)
 */
export const searchIssues = onCall({ cors: true }, async (request) => {
  const { municipalityId, query, categoryId, limit } = request.data || {};

  if (!municipalityId || !query) {
    throw new HttpsError('invalid-argument', 'municipalityId e query são obrigatórios.');
  }

  const results = await searchProvider.searchIssues({
    municipalityId,
    query,
    categoryId,
    limit: limit || 15
  });

  return { results };
});

/**
 * Criação segura de novo Issue com Manifestação Raiz (Seção 4.2 & 11)
 * Executa sanitização determinística obrigatória antes de gravar no Firestore
 */
export const createIssueWithRootManifestation = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O cidadão deve estar autenticado para registrar um problema.');
  }

  const {
    municipalityId,
    title,
    rawDescription,
    categoryId,
    locationApprox,
    agencyIds,
    consents
  } = request.data || {};

  if (!municipalityId || !title || !rawDescription || !categoryId) {
    throw new HttpsError('invalid-argument', 'Campos obrigatórios ausentes.');
  }

  const userId = request.auth.uid;
  const now = new Date().toISOString();

  // 1. Sanitização local obrigatória de PII (Seção 15.2 e 16.1)
  const sanitizationResult = sanitizeText(rawDescription);
  const publicSummary = sanitizationResult.sanitizedText.slice(0, 300);

  // 2. Extração de search tokens
  const searchTokens = generateSearchTokens([
    title,
    publicSummary,
    locationApprox?.neighborhood,
    locationApprox?.city,
    categoryId
  ]);

  const issueRef = db.collection('issues').doc();
  const rootManifestationRef = db.collection('formalManifestations').doc();
  const auditRef = db.collection('auditEvents').doc();

  const issueId = issueRef.id;
  const manifestationId = rootManifestationRef.id;

  const newIssue: Issue = {
    issueId,
    municipalityId,
    title,
    publicSummary,
    categoryId,
    locationApprox: locationApprox || {
      neighborhood: 'Não informado',
      city: 'Município',
      state: 'UF'
    },
    status: IssueStatus.DRAFT,
    agencyIds: agencyIds || [],
    rootManifestationId: manifestationId,
    formalSupportCount: 1,
    commentCount: 0,
    followerCount: 1,
    lastPublicActivityAt: now,
    searchTokens,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    moderationState: sanitizationResult.hasPii ? 'UNDER_MODERATION' : 'DRAFT',
    schemaVersion: 3
  };

  const rootManifestation: FormalManifestation = {
    manifestationId,
    issueId,
    userId,
    municipalityId,
    isRoot: true,
    status: FormalManifestationStatus.SUBMITTED,
    citizenStatement: sanitizationResult.sanitizedText,
    useBaseText: true,
    consents: {
      termVersion: consents?.termVersion || 'v1.0',
      acceptedAt: now,
      userId,
      sanitizedPublicationConsent: consents?.sanitizedPublicationConsent ?? true,
      electronicTransmissionAuthorized: consents?.electronicTransmissionAuthorized ?? true,
      receiveEmailCopy: consents?.receiveEmailCopy ?? true
    },
    identificationRequiredByChannel: {
      fullNameProvided: true,
      cpfProvided: true,
      emailProvided: true
    },
    createdAt: now,
    updatedAt: now
  };

  const auditEvent: AuditEvent = {
    eventId: auditRef.id,
    timestamp: now,
    actorType: 'CITIZEN',
    actorId: userId,
    action: 'CREATE_ISSUE_AND_ROOT_MANIFESTATION',
    entityType: 'ISSUE',
    entityId: issueId,
    metadata: {
      hasPiiSanitized: sanitizationResult.hasPii,
      piiTypes: sanitizationResult.detectedPiiTypes
    },
    correlationId: `create-${issueId}`
  };

  const batch = db.batch();
  batch.set(issueRef, newIssue);
  batch.set(rootManifestationRef, rootManifestation);
  batch.set(auditRef, auditEvent);

  await batch.commit();

  return {
    success: true,
    issueId,
    rootManifestationId: manifestationId,
    moderationState: newIssue.moderationState
  };
});

/**
 * Trigger de Auditoria para alterações em Issues (Seção 27.1)
 */
export const onIssueStatusChange = onDocumentWritten('issues/{issueId}', async (event) => {
  const before = event.data?.before.data() as Issue | undefined;
  const after = event.data?.after.data() as Issue | undefined;

  if (!after) {
    // Exclusão (não recomendada no modelo, mas auditada caso ocorra)
    await db.collection('auditEvents').add({
      timestamp: new Date().toISOString(),
      actorType: 'SYSTEM',
      actorId: 'firestore-trigger',
      action: 'ISSUE_DELETED',
      entityType: 'ISSUE',
      entityId: event.params.issueId,
      correlationId: `delete-${event.params.issueId}`
    });
    return;
  }

  // Verifica se houve alteração de status ou moderação
  if (!before || before.status !== after.status || before.moderationState !== after.moderationState) {
    await db.collection('auditEvents').add({
      timestamp: new Date().toISOString(),
      actorType: 'SYSTEM',
      actorId: 'firestore-trigger',
      action: 'ISSUE_STATE_CHANGED',
      entityType: 'ISSUE',
      entityId: after.issueId,
      metadata: {
        beforeStatus: before?.status,
        afterStatus: after.status,
        beforeModeration: before?.moderationState,
        afterModeration: after.moderationState
      },
      correlationId: `state-${after.issueId}-${Date.now()}`
    });
  }
});

/**
 * Endpoint de Fusão de Problemas Duplicados (Seção 3.4 & AC-12)
 * Apenas Moderador/Admin
 */
export const mergeIssues = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Requer autenticação.');
  }

  const role = request.auth.token.role;
  if (role !== 'moderator' && role !== 'admin') {
    throw new HttpsError('permission-denied', 'Apenas moderadores podem unificar problemas.');
  }

  const { targetIssueId, sourceIssueId, reason } = request.data || {};
  if (!targetIssueId || !sourceIssueId || !reason) {
    throw new HttpsError('invalid-argument', 'targetIssueId, sourceIssueId e reason são obrigatórios.');
  }

  const targetDoc = await db.collection('issues').doc(targetIssueId).get();
  const sourceDoc = await db.collection('issues').doc(sourceIssueId).get();

  if (!targetDoc.exists || !sourceDoc.exists) {
    throw new HttpsError('not-found', 'Um ou ambos os problemas não foram localizados.');
  }

  const target = targetDoc.data() as Issue;
  const source = sourceDoc.data() as Issue;

  try {
    const { updatedTarget, updatedSource, auditEvents } = computeMergedIssue(
      target,
      source,
      request.auth.uid,
      reason
    );

    const batch = db.batch();
    batch.set(db.collection('issues').doc(targetIssueId), updatedTarget);
    batch.set(db.collection('issues').doc(sourceIssueId), updatedSource);

    for (const event of auditEvents) {
      batch.set(db.collection('auditEvents').doc(event.eventId), event);
    }

    await batch.commit();

    return {
      success: true,
      targetIssueId,
      sourceIssueId,
      redirectUrl: `/problemas/${targetIssueId}`
    };
  } catch (err: any) {
    throw new HttpsError('failed-precondition', err.message);
  }
});

/**
 * Endpoint de Divisão de Problemas Agregados Indevidamente (Seção 3.4)
 * Apenas Moderador/Admin
 */
export const splitIssue = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Requer autenticação.');
  }

  const role = request.auth.token.role;
  if (role !== 'moderator' && role !== 'admin') {
    throw new HttpsError('permission-denied', 'Apenas moderadores podem dividir problemas.');
  }

  const { originalIssueId, newIssueData, movedManifestationCount, reason } = request.data || {};
  if (!originalIssueId || !newIssueData || !movedManifestationCount || !reason) {
    throw new HttpsError('invalid-argument', 'Parâmetros obrigatórios de divisão ausentes.');
  }

  const origDoc = await db.collection('issues').doc(originalIssueId).get();
  if (!origDoc.exists) {
    throw new HttpsError('not-found', 'Problema original não encontrado.');
  }

  const original = origDoc.data() as Issue;
  const newIssueRef = db.collection('issues').doc();
  const newRootRef = db.collection('formalManifestations').doc();

  try {
    const { updatedOriginal, newIssue, auditEvents } = computeSplitIssue(
      original,
      {
        ...newIssueData,
        issueId: newIssueRef.id,
        rootManifestationId: newRootRef.id,
        createdBy: request.auth.uid
      },
      movedManifestationCount,
      request.auth.uid,
      reason
    );

    const batch = db.batch();
    batch.set(db.collection('issues').doc(originalIssueId), updatedOriginal);
    batch.set(newIssueRef, newIssue);

    for (const event of auditEvents) {
      batch.set(db.collection('auditEvents').doc(event.eventId), event);
    }

    await batch.commit();

    return {
      success: true,
      originalIssueId,
      newIssueId: newIssue.issueId
    };
  } catch (err: any) {
    throw new HttpsError('failed-precondition', err.message);
  }
});

/**
 * Sugestão em tempo real de possíveis problemas duplicados (Seção 4.2 & AC-02)
 */
export const suggestDuplicateIssues = onCall({ cors: true }, async (request) => {
  const { municipalityId, title, description, categoryId, neighborhood } = request.data || {};

  if (!municipalityId || !title) {
    throw new HttpsError('invalid-argument', 'municipalityId e title são obrigatórios.');
  }

  const rawTokens = generateSearchTokens([title, description, neighborhood]);
  const expandedTokens = expandTokensWithSynonyms(rawTokens);

  const candidates = await issueRepo.searchByTokens(municipalityId, expandedTokens, 20);

  const duplicateSuggestions = findDuplicateCandidates(
    {
      municipalityId,
      title,
      description,
      categoryId,
      neighborhood
    },
    candidates,
    0.35 // threshold mínimo
  );

  return {
    duplicates: duplicateSuggestions.map(d => ({
      issue: d.issue,
      similarityScore: Math.round(d.similarityScore * 100),
      matchReasons: d.matchReasons,
      matchedTokens: d.matchedTokens
    }))
  };
});

/**
 * Adiciona comentário comunitário moderado (Seção 23 & Critério AC-03)
 * Comentar NÃO gera manifestação formal nem despacho ao órgão público.
 */
export const addIssueComment = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Requer autenticação para comentar.');
  }

  const { issueId, text, parentCommentId, authorPublicName } = request.data || {};
  if (!issueId || !text || !text.trim()) {
    throw new HttpsError('invalid-argument', 'issueId e text são obrigatórios.');
  }

  const issueDoc = await db.collection('issues').doc(issueId).get();
  if (!issueDoc.exists) {
    throw new HttpsError('not-found', 'Problema público não encontrado.');
  }

  const userId = request.auth.uid;
  const evaluation = evaluateCommentRisk(text);
  const now = new Date().toISOString();

  const commentRef = db.collection('issues').doc(issueId).collection('comments').doc();
  const auditRef = db.collection('auditEvents').doc();

  const newComment: IssueComment = {
    commentId: commentRef.id,
    issueId,
    userId,
    authorPublicName: authorPublicName || 'Cidadão',
    text: evaluation.sanitizedText,
    parentCommentId: parentCommentId || undefined,
    moderationState: evaluation.moderationState,
    riskFlags: evaluation.riskFlags,
    reportCount: 0,
    createdAt: now
  };

  const auditEvent: AuditEvent = {
    eventId: auditRef.id,
    timestamp: now,
    actorType: 'CITIZEN',
    actorId: userId,
    action: 'COMMENT_ADDED',
    entityType: 'COMMENT',
    entityId: commentRef.id,
    metadata: {
      issueId,
      moderationState: evaluation.moderationState,
      isHighRisk: evaluation.requiresHumanReview,
      riskFlags: evaluation.riskFlags
    },
    correlationId: `comment-${commentRef.id}`
  };

  const batch = db.batch();
  batch.set(commentRef, newComment);
  batch.set(auditRef, auditEvent);

  // Incrementa contagem pública de comentários somente se aprovado ou para controle
  batch.update(db.collection('issues').doc(issueId), {
    commentCount: admin.firestore.FieldValue.increment(1),
    lastPublicActivityAt: now
  });

  // Se flagged, abre caso de moderação
  if (evaluation.requiresHumanReview) {
    const modRef = db.collection('moderationCases').doc();
    batch.set(modRef, {
      caseId: modRef.id,
      entityType: 'COMMENT',
      entityId: commentRef.id,
      issueId,
      riskFlags: evaluation.riskFlags,
      status: 'AUTO_FLAGGED',
      createdAt: now
    });
  }

  await batch.commit();

  return {
    success: true,
    commentId: commentRef.id,
    moderationState: newComment.moderationState,
    sanitizedText: newComment.text
  };
});

/**
 * Denúncia de comentário abusivo ou com vazamento de PII (Seção 23.2)
 */
export const reportIssueComment = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Requer autenticação.');
  }

  const { issueId, commentId, reason, details } = request.data || {};
  if (!issueId || !commentId || !reason) {
    throw new HttpsError('invalid-argument', 'issueId, commentId e reason são obrigatórios.');
  }

  const commentRef = db.collection('issues').doc(issueId).collection('comments').doc(commentId);
  const commentDoc = await commentRef.get();

  if (!commentDoc.exists) {
    throw new HttpsError('not-found', 'Comentário não encontrado.');
  }

  const currentComment = commentDoc.data() as IssueComment;
  const report = {
    reportId: `rep-${Date.now()}`,
    commentId,
    issueId,
    reportingUserId: request.auth.uid,
    reason,
    details,
    createdAt: new Date().toISOString()
  };

  const { updatedComment, shouldCreateModerationCase, auditEvent } = processCommentReport(currentComment, report);

  const batch = db.batch();
  batch.set(commentRef, updatedComment);
  batch.set(db.collection('auditEvents').doc(auditEvent.eventId), auditEvent);

  if (shouldCreateModerationCase) {
    const modRef = db.collection('moderationCases').doc();
    batch.set(modRef, {
      caseId: modRef.id,
      entityType: 'COMMENT',
      entityId: commentId,
      issueId,
      riskFlags: [`REPORTED_${reason}`],
      status: 'HUMAN_REVIEW',
      notes: details,
      createdAt: new Date().toISOString()
    });
  }

  await batch.commit();

  return {
    success: true,
    reportCount: updatedComment.reportCount,
    moderationState: updatedComment.moderationState
  };
});

/**
 * Alternar Acompanhamento (Follow) de Problema Público (Seção 23.1)
 */
export const toggleFollowIssue = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Requer autenticação.');
  }

  const { issueId } = request.data || {};
  if (!issueId) {
    throw new HttpsError('invalid-argument', 'issueId é obrigatório.');
  }

  const userId = request.auth.uid;
  const followerRef = db.collection('issues').doc(issueId).collection('followers').doc(userId);
  const followerDoc = await followerRef.get();
  const issueRef = db.collection('issues').doc(issueId);

  const batch = db.batch();
  let isFollowing = false;

  if (followerDoc.exists) {
    batch.delete(followerRef);
    batch.update(issueRef, {
      followerCount: admin.firestore.FieldValue.increment(-1)
    });
    isFollowing = false;
  } else {
    batch.set(followerRef, {
      userId,
      issueId,
      receiveNotifications: true,
      followedAt: new Date().toISOString()
    });
    batch.update(issueRef, {
      followerCount: admin.firestore.FieldValue.increment(1)
    });
    isFollowing = true;
  }

  await batch.commit();

  return { success: true, isFollowing };
});

const documentProvider = new HtmlDocumentProvider();

/**
 * Criação de Adesão Formal Individual ao Problema Público (Seção 4.3, 14.1 & AC-04)
 */
export const createFormalAdhesion = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Requer autenticação para aderir formalmente.');
  }

  const {
    issueId,
    citizenStatement,
    useBaseText,
    consents,
    isPublicNameVisible
  } = request.data || {};

  if (!issueId) {
    throw new HttpsError('invalid-argument', 'issueId é obrigatório.');
  }

  const userId = request.auth.uid;

  // 1. Validação de consentimentos mandatórios (Seção 8.3 & Princípio P05)
  if (!consents?.sanitizedPublicationConsent || !consents?.electronicTransmissionAuthorized) {
    throw new HttpsError('failed-precondition', 'Os consentimentos de publicação e transmissão são obrigatórios.');
  }

  const issueDoc = await db.collection('issues').doc(issueId).get();
  if (!issueDoc.exists) {
    throw new HttpsError('not-found', 'Problema público não encontrado.');
  }
  const issue = issueDoc.data() as Issue;

  // 2. Validação da regra: Máximo uma adesão ativa por usuário por issue (Seção 14.1)
  const existingSnapshot = await db.collection('formalManifestations')
    .where('issueId', '==', issueId)
    .where('userId', '==', userId)
    .get();

  const existingManifestations = existingSnapshot.docs.map(d => d.data() as FormalManifestation);
  const singleAdhesionCheck = validateSingleAdhesionPerUser(userId, existingManifestations);
  if (!singleAdhesionCheck.valid) {
    throw new HttpsError('already-exists', singleAdhesionCheck.error!);
  }

  const now = new Date().toISOString();
  const nextSeq = (issue.formalSupportCount || 0) + 1;
  const issueNumber = issue.issueId.replace(/\D/g, '') || '001';
  const protocolCode = generateManifestationCode(issueNumber, nextSeq, false);

  const manifestationRef = db.collection('formalManifestations').doc();
  const auditRef = db.collection('auditEvents').doc();

  // 3. Sanitização do relato do cidadão (Seção 15.2 & 16.1)
  const finalStatement = useBaseText ? issue.publicSummary : citizenStatement;
  const sanitizationResult = sanitizeText(finalStatement || '');

  const newManifestation: FormalManifestation = {
    manifestationId: manifestationRef.id,
    issueId,
    userId,
    municipalityId: issue.municipalityId,
    isRoot: false,
    status: FormalManifestationStatus.USER_CONFIRMED,
    citizenStatement: sanitizationResult.sanitizedText,
    useBaseText: Boolean(useBaseText),
    consents: {
      termVersion: consents.termVersion || CURRENT_DOCUMENT_TEMPLATE_VERSION,
      acceptedAt: now,
      userId,
      sanitizedPublicationConsent: consents.sanitizedPublicationConsent,
      electronicTransmissionAuthorized: consents.electronicTransmissionAuthorized,
      receiveEmailCopy: Boolean(consents.receiveEmailCopy)
    },
    identificationRequiredByChannel: {
      fullNameProvided: true,
      cpfProvided: true,
      emailProvided: true
    },
    templateVersion: CURRENT_DOCUMENT_TEMPLATE_VERSION,
    createdAt: now,
    updatedAt: now
  };

  // 4. Geração do documento formal com hash SHA-256 (Seção 21.3)
  const docResult = await documentProvider.generateManifestationDocument(
    newManifestation,
    issue,
    protocolCode
  );
  newManifestation.documentHash = docResult.hashSha256;

  // 5. AuditEvent imutável
  const auditEvent: AuditEvent = {
    eventId: auditRef.id,
    timestamp: now,
    actorType: 'CITIZEN',
    actorId: userId,
    action: 'FORMAL_ADHESION_CREATED',
    entityType: 'FORMAL_MANIFESTATION',
    entityId: manifestationRef.id,
    metadata: {
      issueId,
      protocolCode,
      documentHash: docResult.hashSha256,
      isPublicNameVisible: Boolean(isPublicNameVisible)
    },
    correlationId: `adhesion-${manifestationRef.id}`
  };

  const batch = db.batch();
  batch.set(manifestationRef, newManifestation);
  batch.set(auditRef, auditEvent);
  batch.update(db.collection('issues').doc(issueId), {
    formalSupportCount: admin.firestore.FieldValue.increment(1),
    lastPublicActivityAt: now
  });

  await batch.commit();

  // 6. Disparo individual da reclamação cívica formal ao órgão por e-mail (com Reply-To dinâmico)
  try {
    const agencyId = issue.agencyIds[0] || 'sec-obras-mn';
    const agencyDoc = await db.collection('agencies').doc(agencyId).get();
    if (agencyDoc.exists) {
      const agencyData = agencyDoc.data() as Agency;
      const agencyChannel = agencyData.channels.find(c => c.type === 'EMAIL') || agencyData.channels[0];
      if (agencyChannel) {
        const citizenUser = await admin.auth().getUser(userId).catch(() => null);
        const citizenFullName = citizenUser?.displayName || 'Cidadão Manifestante';
        const citizenEmail = citizenUser?.email || 'cidadao@exemplo.com';

        const adhesionEmail = buildIndividualAdhesionEmail({
          manifestation: newManifestation,
          issue,
          agency: agencyData,
          agencyChannel,
          citizenFullName,
          citizenCpfMasked: '***.***.***-**',
          citizenEmail,
          municipalityName: 'Mundo Novo - MS'
        });

        await mailProvider.send(adhesionEmail);

        if (consents.receiveEmailCopy && citizenEmail) {
          const confirmationEmail = buildCitizenConfirmationEmail(
            citizenEmail,
            newManifestation,
            issue,
            agencyData.name
          );
          await mailProvider.send(confirmationEmail);
        }
      }
    }
  } catch (emailErr) {
    console.warn('[createFormalAdhesion] Aviso no disparo individual de e-mail ao órgão:', emailErr);
  }

  return {
    success: true,
    manifestationId: manifestationRef.id,
    protocolCode,
    documentHash: docResult.hashSha256,
    status: newManifestation.status
  };
});

/**
 * Retirada/Cancelamento de Manifestação Formal (Seção 14.2)
 * Preserva o fato histórico sem apagar o registro
 */
export const withdrawFormalAdhesion = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Requer autenticação.');
  }

  const { manifestationId, reason } = request.data || {};
  if (!manifestationId || !reason) {
    throw new HttpsError('invalid-argument', 'manifestationId e reason são obrigatórios.');
  }

  const manifestationRef = db.collection('formalManifestations').doc(manifestationId);
  const doc = await manifestationRef.get();
  if (!doc.exists) {
    throw new HttpsError('not-found', 'Manifestação formal não encontrada.');
  }

  const manifestation = doc.data() as FormalManifestation;

  try {
    const { updatedManifestation, auditEvent } = processManifestationWithdrawal(
      manifestation,
      request.auth.uid,
      reason
    );

    const batch = db.batch();
    batch.set(manifestationRef, updatedManifestation);
    batch.set(db.collection('auditEvents').doc(auditEvent.eventId), auditEvent);

    // Se ainda não despachada, decrementa contador de apoio do issue
    if (manifestation.status !== FormalManifestationStatus.DISPATCHED) {
      batch.update(db.collection('issues').doc(manifestation.issueId), {
        formalSupportCount: admin.firestore.FieldValue.increment(-1),
        lastPublicActivityAt: new Date().toISOString()
      });
    }

    await batch.commit();

    return {
      success: true,
      manifestationId,
      status: updatedManifestation.status
    };
  } catch (err: any) {
    throw new HttpsError('permission-denied', err.message);
  }
});

/**
 * Endpoint de IA: Sugestão de Categoria e Órgão (Seção 15.1 & AC-10)
 * Executa sanitização obrigatória e opera com degradação graciosa caso a API externa falhe.
 */
export const aiSuggestMetadata = onCall({ cors: true }, async (request) => {
  const { content } = request.data || {};
  if (!content || typeof content !== 'string') {
    throw new HttpsError('invalid-argument', 'O parâmetro content é obrigatório.');
  }

  const aiProvider = new GeminiAIProvider();
  const suggestion = await aiProvider.suggestMetadata(content);
  return { suggestion };
});

/**
 * Endpoint de IA: Geração de Resumo Neutro Público (Seção 15.1)
 */
export const aiGenerateSummary = onCall({ cors: true }, async (request) => {
  const { content } = request.data || {};
  if (!content || typeof content !== 'string') {
    throw new HttpsError('invalid-argument', 'O parâmetro content é obrigatório.');
  }

  const aiProvider = new GeminiAIProvider();
  const summary = await aiProvider.generateNeutralSummary(content);
  return { summary };
});

/**
 * Endpoint de IA: Avaliação de Risco de Conteúdo e Moderação (Seção 15.1 & 16.2)
 */
export const aiEvaluateRisk = onCall({ cors: true }, async (request) => {
  const { content } = request.data || {};
  if (!content || typeof content !== 'string') {
    throw new HttpsError('invalid-argument', 'O parâmetro content é obrigatório.');
  }

  const aiProvider = new GeminiAIProvider();
  const riskReport = await aiProvider.evaluateContentRisk(content);
  return { riskReport };
});

/**
 * Endpoint de Roteamento de Problema para Órgão Competente (Seções 8, 9 & AC-07)
 */
export const routeIssueForDispatch = onCall({ cors: true }, async (request) => {
  const { issueId } = request.data || {};
  if (!issueId) {
    throw new HttpsError('invalid-argument', 'O parâmetro issueId é obrigatório.');
  }

  const issueDoc = await db.collection('issues').doc(issueId).get();
  if (!issueDoc.exists) {
    throw new HttpsError('not-found', 'Problema público não encontrado.');
  }

  const issue = issueDoc.data() as Issue;

  // Busca órgãos do município
  const agenciesSnapshot = await db
    .collection('agencies')
    .where('municipalityId', '==', issue.municipalityId)
    .where('active', '==', true)
    .get();

  const agencies: Agency[] = agenciesSnapshot.docs.map(d => d.data() as Agency);

  const decision = computeIssueRouting(issue, agencies);

  return { decision };
});

/**
 * Endpoint de Homologação / Verificação de Canal de Órgão (Critério AC-07)
 * Restrito a moderadores/administradores autenticados
 */
export const verifyAgencyChannelEndpoint = onCall({ cors: true }, async (request) => {
  if (!request.auth || !request.auth.token.moderator) {
    throw new HttpsError('permission-denied', 'Apenas moderadores homologados podem verificar canais oficiais.');
  }

  const { agencyId, channelId, sourceUrl, acceptsAutomated } = request.data || {};
  if (!agencyId || !channelId || !sourceUrl) {
    throw new HttpsError('invalid-argument', 'agencyId, channelId e sourceUrl são obrigatórios.');
  }

  const agencyRef = db.collection('agencies').doc(agencyId);
  const agencyDoc = await agencyRef.get();
  if (!agencyDoc.exists) {
    throw new HttpsError('not-found', 'Órgão não encontrado.');
  }

  const agency = agencyDoc.data() as Agency;
  const channelIndex = agency.channels.findIndex(c => c.channelId === channelId);
  if (channelIndex === -1) {
    throw new HttpsError('not-found', 'Canal não encontrado no órgão.');
  }

  const verifiedChannel = verifyAgencyChannel(
    agency.channels[channelIndex],
    sourceUrl,
    request.auth.uid,
    Boolean(acceptsAutomated)
  );

  agency.channels[channelIndex] = verifiedChannel;
  agency.updatedAt = new Date().toISOString();

  await agencyRef.set(agency);

  // Registro de Auditoria Append-Only (Seção 27.1)
  const auditRef = db.collection('auditEvents').doc();
  await auditRef.set({
    eventId: auditRef.id,
    timestamp: new Date().toISOString(),
    eventType: 'AGENCY_CHANNEL_VERIFIED',
    actor: {
      type: 'MODERATOR',
      userId: request.auth.uid
    },
    target: {
      entityType: 'AGENCY',
      entityId: agencyId
    },
    action: 'VERIFY_CHANNEL',
    payload: {
      channelId,
      sourceUrl,
      acceptsAutomated: Boolean(acceptsAutomated)
    }
  });

  return {
    success: true,
    channel: verifiedChannel
  };
});

/**
 * Endpoint de Execução de Despacho em Lote (Seção 10, Critérios AC-06, AC-07 & AC-08)
 * Condensa adesões múltiplas (AC-06), bloqueia canais não verificados (AC-07) e envia cópia cidadã (AC-08)
 */
export const executeIssueDispatch = onCall({ cors: true }, async (request) => {
  if (!request.auth || !request.auth.token.moderator) {
    throw new HttpsError('permission-denied', 'Apenas moderadores ou rotinas autorizadas podem disparar o despacho.');
  }

  const { issueId, batchMode = 'DAILY_BATCH' } = request.data || {};
  if (!issueId) {
    throw new HttpsError('invalid-argument', 'O parâmetro issueId é obrigatório.');
  }

  const issueDoc = await db.collection('issues').doc(issueId).get();
  if (!issueDoc.exists) {
    throw new HttpsError('not-found', 'Problema público não encontrado.');
  }

  const issue = issueDoc.data() as Issue;

  // 1. Busca órgãos do município e avalia canal
  const agenciesSnapshot = await db
    .collection('agencies')
    .where('municipalityId', '==', issue.municipalityId)
    .where('active', '==', true)
    .get();

  const agencies: Agency[] = agenciesSnapshot.docs.map(d => d.data() as Agency);
  const routing = computeIssueRouting(issue, agencies);

  // Validação estrita do Critério AC-07
  if (routing.routingStatus === 'BLOCKED_UNVERIFIED_CHANNEL') {
    throw new HttpsError(
      'failed-precondition',
      `[Critério AC-07] Envio automatizado bloqueado: o canal de destino está NÃO VERIFICADO.`
    );
  }

  if (!routing.canSendAutomatedEmail || !routing.selectedChannel) {
    throw new HttpsError(
      'failed-precondition',
      `O canal do órgão não suporta envio de e-mail automatizado (${routing.routingStatus}). Despacho manual requerido.`
    );
  }

  const targetAgency = agencies.find(a => a.agencyId === routing.targetAgencyId);
  if (!targetAgency) {
    throw new HttpsError('not-found', 'Órgão de destino não localizado.');
  }

  // 2. Busca manifestações pendentes de despacho
  const manifestationsSnapshot = await db
    .collection('formalManifestations')
    .where('issueId', '==', issueId)
    .where('status', 'in', [
      FormalManifestationStatus.QUEUED_FOR_DISPATCH,
      FormalManifestationStatus.USER_CONFIRMED,
      FormalManifestationStatus.SUBMITTED
    ])
    .get();

  if (manifestationsSnapshot.empty) {
    throw new HttpsError('failed-precondition', 'Não há manifestações pendentes de envio para este problema.');
  }

  const manifestations = manifestationsSnapshot.docs.map(d => ({
    ...(d.data() as FormalManifestation),
    manifestationId: d.id
  }));

  // 3. Agrupamento em lote determinístico (Critério AC-06)
  const { dispatch, items, auditEvent } = groupManifestationsForDispatch({
    issue,
    manifestations,
    agency: targetAgency,
    channel: routing.selectedChannel,
    batchMode
  });

  // 4. Envio do E-mail Institucional ao Órgão Público
  const mailProvider = new SmtpMailProvider();
  const agencyEmailOptions = buildAgencyDispatchEmail(
    dispatch,
    issue,
    targetAgency,
    routing.selectedChannel
  );

  const agencySendResult = await mailProvider.send(agencyEmailOptions);

  if (!agencySendResult.success) {
    dispatch.status = DispatchStatus.FAILED;
    dispatch.lastError = agencySendResult.error;
    await db.collection('dispatches').doc(dispatch.dispatchId).set(dispatch);
    throw new HttpsError('internal', `Falha no envio de e-mail ao órgão: ${agencySendResult.error}`);
  }

  // Sucesso no envio ao órgão
  dispatch.status = DispatchStatus.SENT;
  dispatch.sentAt = new Date().toISOString();

  // 5. Envio de Cópia aos Cidadãos com Consentimento Expresso (Critério AC-08)
  const citizenCopiesSent: string[] = [];
  for (const m of manifestations) {
    if (m.consents?.receiveEmailCopy) {
      try {
        const userPrivateDoc = await db.collection('usersPrivate').doc(m.userId).get();
        const citizenEmail = userPrivateDoc.data()?.email;
        if (citizenEmail) {
          const citizenMailOptions = buildCitizenConfirmationEmail(
            citizenEmail,
            m,
            issue,
            targetAgency.name
          );
          await mailProvider.send(citizenMailOptions);
          citizenCopiesSent.push(m.manifestationId);
        }
      } catch (err) {
        console.warn(`[executeIssueDispatch] Erro ao enviar cópia cidadã para ${m.userId}:`, err);
      }
    }
  }

  // 6. Transação Atômica no Firestore: atualiza issue, manifestações, despacho e auditoria
  const batch = db.batch();

  // Grava o registro imutável do lote de despacho
  batch.set(db.collection('dispatches').doc(dispatch.dispatchId), dispatch);

  // Atualiza status do Issue para FORWARDED
  batch.update(db.collection('issues').doc(issueId), {
    status: IssueStatus.FORWARDED,
    updatedAt: new Date().toISOString(),
    lastPublicActivityAt: new Date().toISOString()
  });

  // Atualiza status de todas as manifestações enviadas para DISPATCHED
  for (const m of manifestations) {
    batch.update(db.collection('formalManifestations').doc(m.manifestationId), {
      status: FormalManifestationStatus.DISPATCHED,
      dispatchId: dispatch.dispatchId,
      updatedAt: new Date().toISOString()
    });
  }

  // Grava AuditEvent
  batch.set(db.collection('auditEvents').doc(auditEvent.eventId), auditEvent);

  await batch.commit();

  return {
    success: true,
    dispatchId: dispatch.dispatchId,
    itemsCount: items.length,
    sentTo: routing.selectedChannel.addressOrUrl,
    citizenCopiesCount: citizenCopiesSent.length,
    status: dispatch.status
  };
});

/**
 * Endpoint de Registro de Resposta Oficial do Órgão (Seção 22.1)
 * Executa sanitização obrigatória de dados pessoais e atualiza o status do Issue para RESPONDED.
 */
export const receiveAgencyResponseEndpoint = onCall({ cors: true }, async (request) => {
  if (!request.auth || !request.auth.token.moderator) {
    throw new HttpsError('permission-denied', 'Apenas moderadores ou integrações autenticadas podem registrar respostas oficiais.');
  }

  const {
    issueId,
    agencyId,
    rawContent,
    protocolNumber,
    channelReceived = 'EMAIL',
    senderEmailOrContact
  } = request.data || {};

  if (!issueId || !agencyId || !rawContent) {
    throw new HttpsError('invalid-argument', 'issueId, agencyId e rawContent são obrigatórios.');
  }

  const issueDoc = await db.collection('issues').doc(issueId).get();
  if (!issueDoc.exists) {
    throw new HttpsError('not-found', 'Problema público não encontrado.');
  }

  const issue = issueDoc.data() as Issue;
  const responseId = `RESP-${Date.now()}`;

  const { publicResponse, updatedIssueStatus, auditEvent } = processAgencyResponse(
    {
      responseId,
      issueId,
      agencyId,
      channelReceived,
      rawContent,
      protocolNumber,
      senderEmailOrContact,
      receivedAt: new Date().toISOString(),
      moderationState: 'SANITIZED_APPROVED'
    },
    issue
  );

  const batch = db.batch();

  // 1. Grava resposta pública sanitizada
  batch.set(db.collection('publicAgencyResponses').doc(responseId), publicResponse);

  // 2. Atualiza status do Issue para RESPONDED
  batch.update(db.collection('issues').doc(issueId), {
    status: updatedIssueStatus,
    updatedAt: new Date().toISOString(),
    lastPublicActivityAt: new Date().toISOString()
  });

  // 3. Registra evento de auditoria imutável
  batch.set(db.collection('auditEvents').doc(auditEvent.eventId), auditEvent);

  await batch.commit();

  return {
    success: true,
    responseId,
    issueStatus: updatedIssueStatus,
    sanitizedSummary: publicResponse.sanitizedSummary
  };
});

/**
 * Endpoint de Avaliação Comunitária de Resolução (Seção 22.2)
 * Permite que cidadãos votem se a resposta do órgão resolveu o problema e recalcula o consenso.
 */
export const submitResolutionFeedbackEndpoint = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'É necessário estar autenticado para avaliar a resolução do problema.');
  }

  const { issueId, vote, comment } = request.data || {};
  const validVotes: ResolutionVoteOption[] = ['SIM', 'PARCIALMENTE', 'NAO', 'NAO_SEI_AVALIAR'];

  if (!issueId || !vote || !validVotes.includes(vote)) {
    throw new HttpsError('invalid-argument', 'issueId e uma opção de voto válida (SIM, PARCIALMENTE, NAO, NAO_SEI_AVALIAR) são obrigatórios.');
  }

  const userId = request.auth.uid;
  const issueRef = db.collection('issues').doc(issueId);
  const issueDoc = await issueRef.get();
  if (!issueDoc.exists) {
    throw new HttpsError('not-found', 'Problema público não encontrado.');
  }

  const issue = issueDoc.data() as Issue;

  // 1. Grava ou atualiza o voto do usuário na subcoleção resolutionVotes
  const voteRef = db.collection('resolutionVotes').doc(`${issueId}_${userId}`);
  const voteRecord: CitizenResolutionVote = {
    voteId: voteRef.id,
    issueId,
    userId,
    vote,
    comment: comment ? String(comment).slice(0, 300) : undefined,
    votedAt: new Date().toISOString()
  };

  await voteRef.set(voteRecord);

  // 2. Busca todos os votos para este issue e recalcula o consenso
  const allVotesSnapshot = await db
    .collection('resolutionVotes')
    .where('issueId', '==', issueId)
    .get();

  const allVotes = allVotesSnapshot.docs.map(d => d.data() as CitizenResolutionVote);
  const consensus = computeResolutionConsensus(allVotes, 3); // quórum mínimo de 3

  // 3. Se o consenso recomendar alteração de status diferente do atual, atualiza o Issue
  if (consensus.recommendedIssueStatus !== issue.status && consensus.consensusStatus !== 'AWAITING_QUORUM') {
    await issueRef.update({
      status: consensus.recommendedIssueStatus,
      updatedAt: new Date().toISOString(),
      lastPublicActivityAt: new Date().toISOString()
    });

    // Registra evento de auditoria para a transição automática por deliberação popular
    const auditRef = db.collection('auditEvents').doc();
    await auditRef.set({
      eventId: auditRef.id,
      timestamp: new Date().toISOString(),
      correlationId: issueId,
      actorType: 'SYSTEM',
      actorId: 'civic-consensus-engine',
      action: 'ISSUE_STATUS_UPDATED_BY_COMMUNITY_VOTE',
      entityType: 'ISSUE',
      entityId: issueId,
      metadata: {
        newStatus: consensus.recommendedIssueStatus,
        consensusStatus: consensus.consensusStatus,
        totalVotes: consensus.totalVotes,
        percentages: consensus.percentages
      }
    });
  }

  return {
    success: true,
    voteRecord,
    consensus
  };
});

/**
 * Webhook Inbound Email Endpoint (Recepção Automática de Respostas Oficiais de E-mail)
 * Recebe e-mails de secretarias/órgãos municipais, correlaciona ao problema público,
 * higieniza PII (LGPD), anexa o documento/e-mail com Hash SHA-256 e atualiza o estado da ouvidoria.
 */
export const inboundEmailWebhookEndpoint = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
    return;
  }

  try {
    const rawBody = req.body || {};
    const from = rawBody.from || rawBody.sender || rawBody['envelope[from]'] || '';
    const to = rawBody.to || rawBody.recipient || rawBody['envelope[to]'] || '';
    const subject = rawBody.subject || '';
    const bodyText = rawBody.text || rawBody.bodyText || rawBody.body || rawBody['stripped-text'] || '';
    const bodyHtml = rawBody.html || rawBody.bodyHtml || '';
    const headers = typeof rawBody.headers === 'object' ? rawBody.headers : {};

    const payload: InboundEmailPayload = {
      from,
      to,
      subject,
      bodyText,
      bodyHtml,
      headers,
      receivedAt: new Date().toISOString()
    };

    const correlation = extractCorrelationIdentifiers(payload);
    if (!correlation.issueId) {
      res.status(400).json({
        error: 'Não foi possível correlacionar o e-mail a nenhum problema público do OPP.',
        matchedVia: correlation.matchedVia
      });
      return;
    }

    const issueDoc = await db.collection('issues').doc(correlation.issueId).get();
    if (!issueDoc.exists) {
      res.status(404).json({
        error: `Problema público ${correlation.issueId} não encontrado.`
      });
      return;
    }

    const issue = issueDoc.data() as Issue;
    const result = processInboundEmail(payload, issue);

    const batch = db.batch();

    // 1. Grava resposta pública sanitizada com o hash e anexos
    batch.set(
      db.collection('publicAgencyResponses').doc(result.publicResponse.responseId),
      result.publicResponse
    );

    // 2. Atualiza o status do Issue
    batch.update(db.collection('issues').doc(correlation.issueId), {
      status: result.updatedIssueStatus,
      updatedAt: new Date().toISOString(),
      lastPublicActivityAt: new Date().toISOString()
    });

    // 3. Registra evento de auditoria imutável
    batch.set(db.collection('auditEvents').doc(result.auditEvent.eventId), result.auditEvent);

    await batch.commit();

    res.status(200).json({
      success: true,
      responseId: result.publicResponse.responseId,
      issueId: correlation.issueId,
      issueStatus: result.updatedIssueStatus,
      isAutoReply: result.isAutoReply,
      protocolNumber: result.publicResponse.protocolNumber,
      documentHash: result.publicResponse.documentHash
    });
  } catch (err: any) {
    console.error('[inboundEmailWebhookEndpoint] Erro ao processar e-mail de entrada:', err);
    res.status(500).json({ error: 'Erro interno ao processar e-mail de retorno do órgão.', details: err?.message });
  }
});






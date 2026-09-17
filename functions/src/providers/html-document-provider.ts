import * as crypto from 'crypto';
import {
  DocumentProvider,
  FormalManifestation,
  Issue,
  GeneratedDocument,
  buildFormalDocumentHtml
} from '@opp/shared';

export class HtmlDocumentProvider implements DocumentProvider {
  async generateManifestationDocument(
    manifestation: FormalManifestation,
    issue: Issue,
    protocolCode: string
  ): Promise<GeneratedDocument> {
    const { html, templateVersion } = buildFormalDocumentHtml({
      manifestation,
      issue,
      citizenFullName: 'Cidadão Autorizado',
      citizenCpfMasked: '***.***.***-**',
      citizenEmail: 'contato-cidadao@privado.opp',
      agencyName: 'Secretaria Responsável',
      municipalityName: 'Município OPP',
      protocolCode,
      templateVersion: manifestation.templateVersion
    });

    const buffer = Buffer.from(html, 'utf-8');
    const hashSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    return {
      pdfBuffer: buffer,
      hashSha256,
      templateVersion
    };
  }
}

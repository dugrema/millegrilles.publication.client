import {extraireInformationCertificat, validerChaineCertificats} from 'millegrilles.common/lib/forgecommon'

export function verifierChaineCertificats(chainePEM) {
  // Verifie la chaine de certificats et retourne les details du certificat

  const infoChaine = validerChaineCertificats(chainePEM)  // Lance erreur si invalide

  const certificatMaitredescles = chainePEM[0]
  const info = extraireInformationCertificat(certificatMaitredescles)
  return {...infoChaine, ...info}

}

import { Campo, CampoDocumento, CampoFoto, CampoNota, CampoNotaAdjunto } from '@prisma/client';

export const toCampoDto = (campo: Campo) => ({
  ...campo,
  superficieHa: Number(campo.superficieHa),
  latitud: campo.latitud ? Number(campo.latitud) : null,
  longitud: campo.longitud ? Number(campo.longitud) : null,
});

export const toNotaDto = (nota: CampoNota & { adjuntos?: CampoNotaAdjunto[] }) => nota;

export const toDocumentoDto = (documento: CampoDocumento) => documento;

export const toFotoDto = (foto: CampoFoto) => foto;

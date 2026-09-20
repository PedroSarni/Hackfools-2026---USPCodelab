# Vídeos locais dos Reels

Coloque nesta pasta os vídeos da demonstração.

Formatos enumerados automaticamente:

- `.mp4`
- `.webm`

Para reprodução consistente no Electron, prefira:

- MP4 com vídeo H.264 e áudio AAC-LC;
- WebM com vídeo VP8/VP9 e áudio Opus.

HEVC/H.265 dentro de um `.mp4` não é portátil no Electron e pode carregar apenas o áudio. O vídeo `reels06.mp4` foi normalizado para H.264/AAC-LC; a fonte HEVC original está em `sources/`, subpasta ignorada pelo feed.

Não é necessário editar código. Reinicie a janela do Instagram depois de adicionar ou remover arquivos. Extensões diferentes e subpastas são ignoradas.

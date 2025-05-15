/**
 * Gera uma string codificada em base64 de um SVG que simula um efeito shimmer para ser utilizado como placeholder de imagens.
 *
 * Este utilitário cria um SVG que apresenta um efeito de carregamento ("shimmer") com um ícone centralizado de imagem,
 * ideal para ser usado como um placeholder enquanto imagens estão sendo carregadas. O SVG é automaticamente codificado
 * em base64, tornando-o pronto para uso como valor de `blurDataURL` em componentes de imagem, facilitando a implementação
 * e garantindo uma experiência de usuário suave durante o carregamento de imagens.
 *
 * O efeito shimmer é criado com um fundo retangular e um ícone estilizado de imagem, proporcionando uma indicação visual
 * atraente e intuitiva do carregamento de conteúdo.
 *
 * @returns {string} A representação em base64 do SVG de efeito shimmer, pronta para ser utilizada como valor de `blurDataURL`.
 */
export const ImageShimmerPlaceholder = (): `data:image/${string}` => {
  const viewBoxWidth = 200
  const viewBoxHeight = 200

  // Calcula o ponto de início para centralizar o ícone escalado no viewBox
  const scaledIconSize = 24 * 0.7 // Ajuste da escala do ícone
  const iconX = (viewBoxWidth - scaledIconSize) / 2
  const iconY = (viewBoxHeight - scaledIconSize) / 2

  const svg = `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" preserveAspectRatio="xMidYMid meet">
      <style>
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        rect, g {
          animation: pulse 2s infinite;
        }
      </style>
      <rect width="${viewBoxWidth}" height="${viewBoxHeight}" fill="#EFEFEF" />
      <g transform="translate(${iconX}, ${iconY}) scale(0.7)">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" fill="none" stroke="#989898" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="9" cy="9" r="2" fill="none" stroke="#989898" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" fill="none" stroke="#989898" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>
  `

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/**
 * Redimensiona uma imagem mantendo sua proporção e converte para o formato WebP.
 *
 * Esta função realiza os seguintes passos:
 *   1. Lê o arquivo de imagem (File) como Data URL.
 *   2. Carrega a imagem em um elemento Image para obter largura e altura originais.
 *   3. Ajusta as dimensões conforme maxWidth e maxHeight, mantendo a proporção original.
 *   4. Desenha a imagem redimensionada em um canvas com alta qualidade de suavização.
 *   5. Converte o conteúdo do canvas para Blob no formato 'image/webp' e retorna um novo File.
 *
 * @param {File} file        — Arquivo de imagem original a ser processado.
 * @param {number} maxWidth  — Largura máxima permitida no resultado (padrão = 1920).
 * @param {number} maxHeight — Altura máxima permitida no resultado (padrão = 1920).
 * @returns {Promise<File>}  — Promise que resolve com um novo File em WebP e
 *                             dimensões ajustadas.
 *
 * Exemplos usando maxWidth = 1024 e maxHeight = 576:
 * | Exemplo | Dimensão Original | Orientação       | Dimensão Final |
 * | ------- | ----------------- | ---------------- | -------------- |
 * | 1       | 4000 × 3000       | Paisagem 4:3     | 768 × 576      |
 * | 2       | 1600 × 900        | Paisagem 16:9    | 1024 × 576     |
 * | 3       | 3000 × 4000       | Retrato 3:4      | 432 × 576      |
 * | 4       | 900 × 1600        | Retrato 9:16     | 324 × 576      |
 * | 5       | 2000 × 2000       | Quadrada         | 576 × 576      |
 * | 6       | 3000 × 1000       | Panorâmica       | 1024 × 341     |
 * | 7       | 1000 × 3000       | Retrato estreito | 192 × 576      |
 * | 8       | 800 × 400         | Paisagem pequena | 800 × 400 (inalterada) |
 */
export const resizeImageToWebp = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Cria um FileReader para ler o conteúdo do arquivo como Data URL
    const reader = new FileReader()
    reader.readAsDataURL(file)

    // Ao terminar de ler o arquivo:
    reader.onload = (evt) => {
      // Cria elemento Image para carregar a imagem no navegador
      const img = new Image()
      img.src = evt.target?.result as string

      img.onload = () => {
        // Cria um canvas para desenhar e redimensionar a imagem
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return reject(new Error('Falha ao obter contexto do canvas'))
        }

        // Largura e altura originais da imagem
        let { width, height } = img
        // Calcula proporção original
        const aspectRatio = width / height

        // Se a largura exceder maxWidth, redimensiona mantendo proporção
        if (width > maxWidth) {
          width = maxWidth
          height = Math.round(maxWidth / aspectRatio)
        }
        // Se a altura exceder maxHeight, redimensiona mantendo proporção
        if (height > maxHeight) {
          height = maxHeight
          width = Math.round(maxHeight * aspectRatio)
        }

        // Ajusta tamanho do canvas para as novas dimensões
        canvas.width = width
        canvas.height = height

        // Configura suavização para alta qualidade de redimensionamento
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Desenha a imagem redimensionada no canvas
        ctx.drawImage(img, 0, 0, width, height)

        // Converte o conteúdo do canvas em Blob no formato WebP
        canvas.toBlob((blob) => {
          if (!blob) {
            return reject(new Error('Falha ao processar a imagem'))
          }
          // Resolve com um novo File usando extensão .webp
          resolve(
            new File([blob], `${file.name.split('.')[0]}.webp`, {
              type: 'image/webp',
            }),
          )
        }, 'image/webp')
      }

      // Rejeita se falhar ao carregar a imagem
      img.onerror = reject
    }

    // Rejeita se falhar ao ler o arquivo
    reader.onerror = reject
  })
}

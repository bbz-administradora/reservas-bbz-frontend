/**
 * Converte uma string para sua representação em base64.
 *
 * Esta função verifica o ambiente de execução para determinar o método apropriado
 * de codificação em base64, tratando tanto ambientes de servidor (Node.js) quanto de cliente (navegador).
 *
 * No ambiente do servidor (Node.js), utiliza `Buffer.from(str).toString('base64')` para converter
 * a string para base64, aproveitando a API de Buffer do Node.js para lidar com a codificação de strings.
 *
 * No ambiente do cliente (navegador), utiliza `window.btoa(str)` para realizar a codificação em base64,
 * utilizando a função nativa `btoa` disponível na maioria dos navegadores modernos para converter strings
 * contendo caracteres diretamente representáveis em ASCII para base64.
 *
 * @param {string} str - A string que será convertida para base64.
 * @returns {string} A representação em base64 da string fornecida.
 */
export const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

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
 * Redimensiona uma imagem para manter um tamanho máximo, preservando a proporção e convertendo para WebP.
 *
 * A imagem será automaticamente ajustada com base na sua orientação:
 * - Se for mais larga que alta (paisagem), limita a largura (`maxWidth`).
 * - Se for mais alta que larga (retrato), limita a altura (`maxHeight`).
 * - Mantém a proporção original para evitar distorções.
 *
 * @param {File} file - Arquivo de imagem a ser redimensionado.
 * @param {number} maxSize - Tamanho máximo para largura ou altura (padrão: 1920).
 * @returns {Promise<File>} Retorna um novo arquivo `.webp` redimensionado.
 *
 * @example
 * const file = document.querySelector('input[type="file"]').files[0];
 * const resizedFile = await resizeImageToWebp(file);
 * console.log('Nova imagem:', resizedFile);
 */
export const resizeImageToWebp = (
  file: File,
  maxSize: number = 1920,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (ctx) {
          let { width, height } = img

          // Verifica qual é a maior dimensão para definir o redimensionamento
          if (width > height && width > maxSize) {
            height = Math.round((maxSize / width) * height)
            width = maxSize
          } else if (height > width && height > maxSize) {
            width = Math.round((maxSize / height) * width)
            height = maxSize
          }

          canvas.width = width
          canvas.height = height

          // Melhor qualidade na renderização
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(
                new File([blob], `${file.name.split('.')[0]}.webp`, {
                  type: 'image/webp',
                }),
              )
            } else {
              reject(new Error('Falha ao processar a imagem'))
            }
          }, 'image/webp')
        } else {
          reject(new Error('Falha ao obter contexto do canvas'))
        }
      }
      img.src = event.target?.result as string
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

export function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180
}

/**
 * Retorna a nova área delimitadora de um retângulo rotacionado.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * Função para criar uma imagem com suporte a CORS.
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // Evita problemas de CORS
    image.src = url
  })

/**
 * Retorna a imagem cortada com rotação aplicada no formato WebP.
 */
export const getCroppedImgWebp = async (
  imageSrc: string,
  croppedAreaPixels: {
    x: number
    y: number
    width: number
    height: number
  },
  rotation = 0,
  targetSize = 500, // Redimensiona para 320x320 por padrão
): Promise<string | Blob> => {
  try {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Falha ao criar contexto 2D')
    }

    // Melhor qualidade na renderização
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Calcula a área delimitadora após a rotação
    const { width: rotatedWidth, height: rotatedHeight } = rotateSize(
      image.width,
      image.height,
      rotation,
    )

    // Configura o tamanho do canvas para a área delimitadora rotacionada
    canvas.width = rotatedWidth
    canvas.height = rotatedHeight

    // Move o contexto para o centro do canvas
    ctx.translate(rotatedWidth / 2, rotatedHeight / 2)
    // Rotaciona o contexto
    ctx.rotate(getRadianAngle(rotation))
    // Desenha a imagem centralizada
    ctx.drawImage(image, -image.width / 2, -image.height / 2)

    // Cria um canvas para o recorte
    const croppedCanvas = document.createElement('canvas')
    const croppedCtx = croppedCanvas.getContext('2d')

    if (!croppedCtx) {
      throw new Error('Falha ao criar contexto 2D para o recorte')
    }

    // Define o tamanho do canvas de recorte para o tamanho alvo
    croppedCanvas.width = targetSize
    croppedCanvas.height = targetSize

    // Calcula a escala para redimensionar a área cortada para o tamanho alvo
    const scaleX = targetSize / croppedAreaPixels.width
    const scaleY = targetSize / croppedAreaPixels.height
    const scale = Math.min(scaleX, scaleY)

    const scaledWidth = croppedAreaPixels.width * scale
    const scaledHeight = croppedAreaPixels.height * scale

    // Desenha a área cortada do canvas rotacionado no canvas de recorte
    croppedCtx.drawImage(
      canvas,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      (targetSize - scaledWidth) / 2,
      (targetSize - scaledHeight) / 2,
      scaledWidth,
      scaledHeight,
    )

    // Converte o canvas de recorte para Blob no formato WebP com alta qualidade (90%)
    return new Promise((resolve, reject) => {
      croppedCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao criar Blob'))
            return
          }
          resolve(blob) // Retorna Blob diretamente
        },
        'image/webp',
        0.9,
      )
    })
  } catch (error) {
    return Promise.reject(error)
  }
}

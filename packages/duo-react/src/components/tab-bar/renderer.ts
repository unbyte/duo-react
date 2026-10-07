import type { BackdropRegion } from '@private/browser'
import type { GlassGeometry } from './layout'
import { canvasPadding, glassShaders, vertex } from './shaders'

interface GlassFrame {
  readonly backdrop?: BackdropRegion
  readonly origin: { readonly x: number; readonly y: number }
  readonly geometry: GlassGeometry
  readonly count: number
  readonly x: number
  readonly growth: number
  readonly dark: boolean
  readonly accents: readonly string[]
  readonly pairedIcons: readonly boolean[]
}

const optics = {
  dispersion: 0.8,
  rimDistortion: 1.2,
  containerInset: 3.3,
  edgeCurlWidth: 4,
  edgeCurlStrength: 2,
  outerRefraction: true,
  outerRefractionStrength: 0.6,
} as const

export class GlassRenderer {
  private readonly gl: WebGL2RenderingContext
  private readonly shaders: WebGLShader[] = []
  private readonly textures: WebGLTexture[] = []
  private readonly programs: WebGLProgram[] = []
  private readonly framebuffer: WebGLFramebuffer
  private readonly program: WebGLProgram
  private readonly outerProgram: WebGLProgram
  private readonly uniforms: Record<string, WebGLUniformLocation | null>
  private readonly outerUniforms: Record<string, WebGLUniformLocation | null>
  private surfaceWidth = 0
  private surfaceHeight = 0
  private readonly neutralCanvas = document.createElement('canvas')
  private uploadedNeutral = false
  private uploadedBackdrop?: BackdropRegion
  private uploadedArtwork?: HTMLCanvasElement
  private readonly colorCanvas = document.createElement('canvas')
  private readonly colorContext = this.colorCanvas.getContext('2d')!
  private accents: readonly string[] = []
  private pairedIcons: readonly boolean[] = []

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly vertical: boolean,
  ) {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    })
    if (!gl) throw new Error('WebGL 2 is unavailable')
    this.gl = gl
    this.framebuffer = gl.createFramebuffer()!
    const { fragment, outerFragment } = glassShaders(vertical)
    try {
      const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertex)
      this.program = this.linkProgram(vertexShader, fragment)
      this.outerProgram = this.linkProgram(vertexShader, outerFragment)
      for (let i = 0; i < 5; i++) {
        const texture = gl.createTexture()!
        this.textures.push(texture)
        gl.activeTexture(gl.TEXTURE0 + i)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          i >= 3 ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR,
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      }
      this.uniforms = this.getUniforms(this.program)
      this.outerUniforms = this.getUniforms(this.outerProgram)
      gl.useProgram(this.program)
      gl.uniform1i(this.uniforms.uBackdrop, 0)
      gl.uniform1i(this.uniforms.uArtwork, 1)
      gl.uniform1i(this.uniforms.uBlurredBackdrop, 2)
      gl.uniform1i(this.uniforms.uAccents, 4)
      gl.useProgram(this.outerProgram)
      gl.uniform1i(this.outerUniforms.uSurface, 3)
    } catch (error) {
      this.dispose()
      throw error
    }
    this.neutralCanvas.width = this.neutralCanvas.height = 1
    const neutralContext = this.neutralCanvas.getContext('2d')!
    neutralContext.fillStyle = '#ffffff'
    neutralContext.fillRect(0, 0, 1, 1)
    this.colorCanvas.width = this.colorCanvas.height = 1
  }

  dispose() {
    const { gl } = this
    this.textures.forEach((texture) => {
      gl.deleteTexture(texture)
    })
    this.shaders.forEach((shader) => {
      gl.deleteShader(shader)
    })
    this.programs.forEach((program) => {
      gl.deleteProgram(program)
    })
    gl.deleteFramebuffer(this.framebuffer)
    if (!this.canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext()
  }

  private compileShader(type: number, source: string) {
    const { gl } = this
    const shader = gl.createShader(type)!
    this.shaders.push(shader)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed')
    return shader
  }
  private linkProgram(vertexShader: WebGLShader, fragmentSource: string) {
    const { gl } = this
    const program = gl.createProgram()!
    this.programs.push(program)
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, this.compileShader(gl.FRAGMENT_SHADER, fragmentSource))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program) || 'Shader link failed')
    return program
  }

  private getUniforms(program: WebGLProgram) {
    const { gl } = this
    return Object.fromEntries(
      Array.from({ length: gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) }, (_, index) => {
        const { name } = gl.getActiveUniform(program, index)!
        return [name, gl.getUniformLocation(program, name)]
      }),
    )
  }

  private upload(unit: number, source: HTMLCanvasElement, premultiplied = false) {
    const { gl, textures } = this
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, textures[unit])
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiplied)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.generateMipmap(gl.TEXTURE_2D)
  }

  draw(props: GlassFrame, artwork: HTMLCanvasElement) {
    const {
      gl,
      canvas,
      vertical,
      framebuffer,
      textures,
      program,
      outerProgram,
      uniforms,
      outerUniforms,
    } = this
    const { geometry } = props
    if (gl.isContextLost()) return false
    const ratio = Math.min(devicePixelRatio || 1, 2)
    const crossSize = geometry.cross
    const canvasWidth = (vertical ? crossSize : geometry.length) + canvasPadding * 2
    const canvasHeight = (vertical ? geometry.length : crossSize) + canvasPadding * 2
    const width = Math.round(canvasWidth * ratio)
    const height = Math.round(canvasHeight * ratio)
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    const outerEnabled =
      optics.outerRefraction && optics.outerRefractionStrength > 0 && props.growth > 0
    gl.bindFramebuffer(gl.FRAMEBUFFER, outerEnabled ? framebuffer : null)
    if (outerEnabled && (this.surfaceWidth !== width || this.surfaceHeight !== height)) {
      gl.activeTexture(gl.TEXTURE3)
      gl.bindTexture(gl.TEXTURE_2D, textures[3])
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[3], 0)
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
        throw new Error('Outer refraction framebuffer is incomplete')
      this.surfaceWidth = width
      this.surfaceHeight = height
    }
    gl.activeTexture(gl.TEXTURE3)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.viewport(0, 0, width, height)
    gl.useProgram(program)
    if (props.backdrop && props.backdrop !== this.uploadedBackdrop) {
      this.upload(0, props.backdrop.canvas)
      this.upload(2, props.backdrop.blurred)
      this.uploadedBackdrop = props.backdrop
    } else if (!props.backdrop && !this.uploadedNeutral) {
      this.upload(0, this.neutralCanvas)
      this.upload(2, this.neutralCanvas)
      this.uploadedNeutral = true
    }
    if (this.uploadedArtwork !== artwork) {
      // Filter transparent artwork in premultiplied form to avoid dark fringes.
      this.upload(1, artwork, true)
      this.uploadedArtwork = artwork
    }
    gl.uniform2f(uniforms.uCanvasSize, canvasWidth, canvasHeight)
    gl.uniform2f(uniforms.uSceneSize, props.backdrop?.width ?? 1, props.backdrop?.height ?? 1)
    gl.uniform2f(
      uniforms.uBarOrigin,
      props.origin.x - (props.backdrop?.x ?? 0),
      props.origin.y - (props.backdrop?.y ?? 0),
    )
    gl.uniform1f(uniforms.uSceneScale, props.backdrop ? 1 : 0)
    gl.uniform1f(uniforms.uBarWidth, geometry.length)
    gl.uniform1f(uniforms.uBarHeight, crossSize)
    gl.uniform1f(uniforms.uFirstCenter, geometry.first)
    gl.uniform1f(uniforms.uLabels, geometry.labels)
    gl.uniform1f(uniforms.uPitch, geometry.pitch)
    gl.uniform1f(uniforms.uCount, props.count)
    gl.uniform2f(uniforms.uLensSize, geometry.lensLength, geometry.lensCross)
    gl.uniform1f(uniforms.uLensX, props.x)
    gl.uniform1f(uniforms.uGrowth, props.growth)
    gl.uniform1f(uniforms.uDispersion, optics.dispersion)
    gl.uniform1f(uniforms.uRimDistortion, optics.rimDistortion)
    gl.uniform1f(uniforms.uContainerInset, optics.containerInset)
    gl.uniform1f(uniforms.uEdgeCurlWidth, optics.edgeCurlWidth)
    gl.uniform1f(uniforms.uEdgeCurlStrength, optics.edgeCurlStrength)
    gl.uniform1f(uniforms.uDark, props.dark ? 1 : 0)
    if (
      this.accents.length !== props.accents.length ||
      props.accents.some((color, index) => color !== this.accents[index]) ||
      props.pairedIcons.some((paired, index) => paired !== this.pairedIcons[index])
    ) {
      this.colorCanvas.width = props.accents.length
      this.colorCanvas.height = 2
      props.accents.forEach((color, index) => {
        this.colorContext.fillStyle = color
        this.colorContext.fillRect(index, 0, 1, 1)
        this.colorContext.fillStyle = props.pairedIcons[index] ? '#ffffff' : '#000000'
        this.colorContext.fillRect(index, 1, 1, 1)
      })
      this.upload(4, this.colorCanvas)
      this.accents = props.accents
      this.pairedIcons = props.pairedIcons
    }
    gl.uniform1f(uniforms.uPixel, 1 / ratio)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    if (outerEnabled) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.useProgram(outerProgram)
      gl.activeTexture(gl.TEXTURE3)
      gl.bindTexture(gl.TEXTURE_2D, textures[3])
      gl.uniform2f(outerUniforms.uCanvasSize, canvasWidth, canvasHeight)
      gl.uniform2f(outerUniforms.uLensSize, geometry.lensLength, geometry.lensCross)
      gl.uniform1f(outerUniforms.uLensX, props.x)
      gl.uniform1f(outerUniforms.uBarHeight, crossSize)
      gl.uniform1f(outerUniforms.uLabels, geometry.labels)
      gl.uniform1f(outerUniforms.uGrowth, props.growth)
      gl.uniform1f(outerUniforms.uDispersion, optics.dispersion)
      gl.uniform1f(outerUniforms.uStrength, optics.outerRefractionStrength)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    return true
  }
}

import { canvasPadding, glassShaders, vertex } from "./shaders"
import type { BackdropFrame } from "../../backdrop/store"
import type { GlassFrame } from "./shared"

export function createRenderer(canvas: HTMLCanvasElement, vertical: boolean) {
  const { fragment, outerFragment } = glassShaders(vertical)
  const context = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
  })
  if (!context) throw new Error("WebGL 2 is unavailable")
  const gl = context
  const shaders: WebGLShader[] = []
  const textures: WebGLTexture[] = []
  const programs: WebGLProgram[] = []
  const framebuffer = gl.createFramebuffer()!
  function dispose() {
    textures.forEach((texture) => gl.deleteTexture(texture))
    shaders.forEach((shader) => gl.deleteShader(shader))
    programs.forEach((program) => gl.deleteProgram(program))
    gl.deleteFramebuffer(framebuffer)
    if (!canvas.isConnected) gl.getExtension("WEBGL_lose_context")?.loseContext()
  }
  function compileShader(type: number, source: string) {
    const shader = gl.createShader(type)!
    shaders.push(shader)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed")
    return shader
  }
  function linkProgram(vertexShader: WebGLShader, fragmentSource: string) {
    const program = gl.createProgram()!
    programs.push(program)
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program) || "Shader link failed")
    return program
  }
  let program: WebGLProgram
  let outerProgram: WebGLProgram
  try {
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertex)
    program = linkProgram(vertexShader, fragment)
    outerProgram = linkProgram(vertexShader, outerFragment)
    for (let i = 0; i < 5; i++) {
      const texture = gl.createTexture()!
      textures.push(texture)
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
  } catch (error) {
    dispose()
    throw error
  }
  function getUniforms(program: WebGLProgram) {
    return Object.fromEntries(
      Array.from({ length: gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) }, (_, index) => {
        const { name } = gl.getActiveUniform(program, index)!
        return [name, gl.getUniformLocation(program, name)]
      }),
    )
  }
  const uniforms = getUniforms(program)
  const outerUniforms = getUniforms(outerProgram)
  gl.useProgram(program)
  gl.uniform1i(uniforms.uBackdrop, 0)
  gl.uniform1i(uniforms.uArtwork, 1)
  gl.uniform1i(uniforms.uBlurredBackdrop, 2)
  gl.uniform1i(uniforms.uAccents, 4)
  gl.useProgram(outerProgram)
  gl.uniform1i(outerUniforms.uSurface, 3)
  let surfaceWidth = 0
  let surfaceHeight = 0
  const neutralCanvas = document.createElement("canvas")
  neutralCanvas.width = neutralCanvas.height = 1
  const neutralContext = neutralCanvas.getContext("2d")!
  neutralContext.fillStyle = "#ffffff"
  neutralContext.fillRect(0, 0, 1, 1)
  let uploadedNeutral = false
  let uploadedBackdrop: BackdropFrame | undefined
  let uploadedArtwork: HTMLCanvasElement | undefined
  const colorCanvas = document.createElement("canvas")
  colorCanvas.width = colorCanvas.height = 1
  const colorContext = colorCanvas.getContext("2d")!
  let accents: readonly string[] = []
  function upload(unit: number, source: HTMLCanvasElement) {
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, textures[unit])
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.generateMipmap(gl.TEXTURE_2D)
  }
  return {
    dispose,
    draw(props: GlassFrame, artwork: HTMLCanvasElement) {
      if (gl.isContextLost()) return false
      const ratio = Math.min(devicePixelRatio || 1, 2)
      const crossSize = props.crossSize ?? 62
      const canvasWidth = (vertical ? crossSize : props.width) + canvasPadding * 2
      const canvasHeight = (vertical ? props.width : crossSize) + canvasPadding * 2
      const width = Math.round(canvasWidth * ratio)
      const height = Math.round(canvasHeight * ratio)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      const outerEnabled =
        props.outerRefraction && props.outerRefractionStrength > 0 && props.growth > 0
      gl.bindFramebuffer(gl.FRAMEBUFFER, outerEnabled ? framebuffer : null)
      if (outerEnabled && (surfaceWidth !== width || surfaceHeight !== height)) {
        gl.activeTexture(gl.TEXTURE3)
        gl.bindTexture(gl.TEXTURE_2D, textures[3])
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[3], 0)
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
          throw new Error("Outer refraction framebuffer is incomplete")
        surfaceWidth = width
        surfaceHeight = height
      }
      gl.activeTexture(gl.TEXTURE3)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.viewport(0, 0, width, height)
      gl.useProgram(program)
      if (props.backdrop && props.backdrop !== uploadedBackdrop) {
        upload(0, props.backdrop.canvas)
        upload(2, props.backdrop.tabBlur)
        uploadedBackdrop = props.backdrop
      } else if (!props.backdrop && !uploadedNeutral) {
        upload(0, neutralCanvas)
        upload(2, neutralCanvas)
        uploadedNeutral = true
      }
      if (uploadedArtwork !== artwork) {
        upload(1, artwork)
        uploadedArtwork = artwork
      }
      gl.uniform2f(uniforms.uCanvasSize, canvasWidth, canvasHeight)
      gl.uniform2f(uniforms.uSceneSize, props.backdrop?.width ?? 1, props.backdrop?.height ?? 1)
      gl.uniform2f(uniforms.uBarOrigin, props.origin.x, props.origin.y)
      gl.uniform1f(uniforms.uSceneScale, props.backdrop ? 1 : 0)
      gl.uniform1f(uniforms.uBarWidth, props.width)
      gl.uniform1f(uniforms.uBarHeight, crossSize)
      gl.uniform1f(uniforms.uFirstCenter, props.firstCenter ?? 4 + props.itemWidth / 2)
      gl.uniform1f(uniforms.uLabels, props.labels ?? 1)
      gl.uniform1f(uniforms.uPitch, props.pitch)
      gl.uniform1f(uniforms.uCount, props.count)
      gl.uniform2f(uniforms.uLensSize, props.lensWidth, props.lensHeight)
      gl.uniform1f(uniforms.uLensX, props.x)
      gl.uniform1f(uniforms.uGrowth, props.growth)
      gl.uniform1f(uniforms.uDispersion, props.dispersion)
      gl.uniform1f(uniforms.uRimDistortion, props.rimDistortion)
      gl.uniform1f(uniforms.uContainerInset, props.containerInset)
      gl.uniform1f(uniforms.uEdgeCurlWidth, props.edgeCurlWidth)
      gl.uniform1f(uniforms.uEdgeCurlStrength, props.edgeCurlStrength)
      gl.uniform1f(uniforms.uDark, props.dark ? 1 : 0)
      if (
        accents.length !== props.accents.length ||
        props.accents.some((color, index) => color !== accents[index])
      ) {
        colorCanvas.width = props.accents.length
        props.accents.forEach((color, index) => {
          colorContext.fillStyle = color
          colorContext.fillRect(index, 0, 1, 1)
        })
        upload(4, colorCanvas)
        accents = props.accents
      }
      gl.uniform1f(uniforms.uPixel, 1 / ratio)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (outerEnabled) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.useProgram(outerProgram)
        gl.activeTexture(gl.TEXTURE3)
        gl.bindTexture(gl.TEXTURE_2D, textures[3])
        gl.uniform2f(outerUniforms.uCanvasSize, canvasWidth, canvasHeight)
        gl.uniform2f(outerUniforms.uLensSize, props.lensWidth, props.lensHeight)
        gl.uniform1f(outerUniforms.uLensX, props.x)
        gl.uniform1f(outerUniforms.uBarHeight, crossSize)
        gl.uniform1f(outerUniforms.uLabels, props.labels ?? 1)
        gl.uniform1f(outerUniforms.uGrowth, props.growth)
        gl.uniform1f(outerUniforms.uDispersion, props.dispersion)
        gl.uniform1f(outerUniforms.uStrength, props.outerRefractionStrength)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
      return true
    },
  }
}

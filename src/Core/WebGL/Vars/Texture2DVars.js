import Vars from "./Vars.js";
import UniformBufferI from "../UniformBufferI.js";
import Tools from "../../Util/Tools.js";
import RadianceLoader from "../../../Supp/RadianceLoader.js";

/**
 * Texture2DVars。<br/>
 * 表示2D纹理数据。<br/>
 * @author Kkk
 * @date 2021年3月3日16点39分
 * @lastdate 2021年3月17日14点53分
 */
export default class Texture2DVars extends Vars{
    static _S_TEMP_COLOR = new UniformBufferI(4);
    // 纹理滤波常量
    static S_FILTERS = {S_NEAREST:0x001, S_LINEAR:0x002, S_LINEAR_MIPMAP_NEAREST:0x003, S_NEAREST_MIPMAP_LINEAR:0x004, S_LINEAR_MIPMAP_LINEAR:0x005, S_NEAREST_MIPMAP_NEAREST:0x006};
    // 纹理参数常量
    static S_WRAPS = {S_REPEAT:0x001, S_CLAMP:0X002, S_CLAMP_TO_EDGE:0x003, S_CLAMP_TO_BORDER:0x004};
    // 纹理格式
    static S_TEXTURE_FORMAT = {};
    constructor(scene) {
        super(scene);
        this._m_Scene = scene;
        const gl = scene.getCanvas().getGLContext();
        Texture2DVars.S_TEXTURE_FORMAT = {
            S_RGB:gl.RGB,
            S_RGBA:gl.RGBA,
            S_RGB16F:gl.RGB16F,
            S_RGB32F:gl.RGB32F,
            S_RGBA16F:gl.RGBA16F,
            S_RGBA32F:gl.RGBA32F,
            S_RGBE5:gl.RGB9_E5,
            S_SRGB:gl.SRGB,
            S_SRGB8:gl.SRGB8,
            S_SRGBA:gl.SRGB8_ALPHA8,
            S_SHORT:gl.SHORT,
            S_INT:gl.INT,
            S_BYTE:gl.BYTE,
            S_UNSIGNED_BYTE:gl.UNSIGNED_BYTE,
            S_FLOAT:gl.FLOAT
        };
        // 创建纹理目标
        this._m_Texture = gl.createTexture();
        // 设置默认纹理滤波
        this._setFilter(scene, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        this._setFilter(scene, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // 内部格式（默认为RGBA）
        this._m_Internalformat = gl.RGBA;
        // 外部格式（默认为RGBA）
        this._m_Format = gl.RGBA;
        // 数据类型
        this._m_Type = gl.UNSIGNED_BYTE;
        // 数据更新标记
        this._m_UpdateImage = false;
        this._m_Image = null;
        // 用于保持原始数据的引用
        this._m_ImageSource = null;
        this._m_Rgbe = false;
        this._m_Width = -1;
        this._m_Height = -1;
        // 翻转y(需要在设置图像之前设置)
        this._m_FlipY = false;
        // 默认4字节对齐
        this._m_Alignment = 4;
        this._m_WrapS = null;
        this._m_WrapT = null;
        this._m_MinFilter = Texture2DVars.S_FILTERS.S_LINEAR_MIPMAP_NEAREST;
        this._m_MagFilter = Texture2DVars.S_FILTERS.S_LINEAR;
    }

    /**
     * 设置纹理格式。<br/>
     * @param {Number}[internalFormat]
     * @param {Number}[format]
     * @param {Number}[type]
     */
    setTextureFormat(internalFormat, format, type){
        this._m_Internalformat = internalFormat;
        this._m_Format = format;
        this._m_Type = type;
    }

    /**
     * 设置对齐模式。<br/>
     * @param {Number}[alignment]
     */
    setAlignment(alignment){
        if(this._m_Alignment != alignment){
            this._m_Alignment = alignment;
            // const gl = this._m_Scene.getCanvas().getGLContext();
            // gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
            // gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);
            // gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }

    /**
     * 更新纹理滤波设置。<br/>
     */
    updateTextureFilter(){
        // 设置默认纹理滤波
        const gl = this._m_Scene.getCanvas().getGLContext();
        if(this._m_WrapS){
            this._setWrap(this._m_Scene, gl.TEXTURE_WRAP_S, this._parseWrap(gl, this._m_WrapS));
        }
        if(this._m_WrapT){
            this._setWrap(this._m_Scene, gl.TEXTURE_WRAP_T, this._parseWrap(gl, this._m_WrapT));
        }
        if(this._m_MinFilter){
            this._setFilter(this._m_Scene, gl.TEXTURE_MIN_FILTER, this._parseFilter(gl, this._m_MinFilter));
        }
        if(this._m_MagFilter){
            this._setFilter(this._m_Scene, gl.TEXTURE_MAG_FILTER, this._parseFilter(gl, this._m_MagFilter));
        }
    }

    /**
     * 直接上载指定数组数据到纹理中。<br/>
     * @param {Number}[loc 纹理地址]
     * @param {Number}[w 纹理数据宽度]
     * @param {Number}[h 纹理数据高度]
     * @param {ArrayBuffer}[data]
     */
    uploadArrayData(loc, w, h, data){
        const gl = this._m_Scene.getCanvas().getGLContext();
        gl.activeTexture(gl.TEXTURE0 + loc);
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this._m_FlipY);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, this._m_Alignment);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            this._m_Internalformat,
            w,
            h,
            0,
            this._m_Format,
            this._m_Type,
            data
        );
    }

    /**
     * 翻转图像。<br/>
     * 需要在设置图像数据之前设置。<br/>
     * @param {Boolean}[flipY true表示翻转,默认为false]
     */
    setFlipY(flipY){
        this._m_FlipY = flipY;
    }

    /**
     * 硬件mipmap。<br/>
     * @param {Scene}[scene]
     */
    genMipmap(scene){
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * 设置纹理滤波。<br/>
     * @param {Scene}[scene]
     * @param {Number}[minfilter Texture2DVars.S_FILTERS常量枚举之一]
     * @param {Number}[magfilter Texture2DVars.S_FILTERS常量枚举之一]
     */
    setFilter(scene, minfilter, magfilter){
        this._m_MinFilter = minfilter;
        this._m_MagFilter = magfilter;
        // const gl = scene.getCanvas().getGLContext();
        // this._setFilter(scene, gl.TEXTURE_MIN_FILTER, this._parseFilter(gl, minfilter));
        // this._setFilter(scene, gl.TEXTURE_MAG_FILTER, this._parseFilter(gl, magfilter));
    }

    /**
     * 解析纹理滤波枚举常量。<br/>
     * @param {WebGL}[gl]
     * @param {Number}[filterEnum]
     * @return {WebGLObject}
     * @private
     */
    _parseFilter(gl, filterEnum){
        switch (filterEnum) {
            case Texture2DVars.S_FILTERS.S_LINEAR:
                return gl.LINEAR;
            case Texture2DVars.S_FILTERS.S_NEAREST:
                return gl.NEAREST;
            case Texture2DVars.S_FILTERS.S_LINEAR_MIPMAP_NEAREST:
                return gl.LINEAR_MIPMAP_NEAREST;
            case Texture2DVars.S_FILTERS.S_LINEAR_MIPMAP_LINEAR:
                return gl.LINEAR_MIPMAP_LINEAR;
            case Texture2DVars.S_FILTERS.S_NEAREST_MIPMAP_LINEAR:
                return gl.NEAREST_MIPMAP_LINEAR;
            case Texture2DVars.S_FILTERS.S_NEAREST_MIPMAP_NEAREST:
                return gl.NEAREST_MIPMAP_NEAREST;
        }
        return null;
    }

    /**
     * 设置纹理滤波。<br/>
     * @param {Scene}[scene]
     * @param {Number}[texEnum]
     * @param {Number}[filter]
     */
    _setFilter(scene, texEnum, filter){
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.texParameteri(gl.TEXTURE_2D, texEnum, filter);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * 设置纹理边缘处理。<br/>
     * @param {Scene}[scene]
     * @param {Number}[wrapS Texture2DVars.S_WRAP枚举常量之一]
     * @param {Number}[wrapT Texture2DVars.S_WRAP枚举常量之一]
     */
    setWrap(scene, wrapS, wrapT){
        this._m_WrapS = wrapS;
        this._m_WrapT = wrapT;
        // const gl = scene.getCanvas().getGLContext();
        // this._setWrap(scene, gl.TEXTURE_WRAP_S, this._parseWrap(gl, wrapS));
        // this._setWrap(scene, gl.TEXTURE_WRAP_T, this._parseWrap(gl, wrapT));
    }

    /**
     * 解析纹理边缘处理枚举常量。<br/>
     * @param {WebGL}[gl]
     * @param {Number}[wrapEnum]
     * @return {Number}
     * @private
     */
    _parseWrap(gl, wrapEnum){
        switch (wrapEnum) {
            case Texture2DVars.S_WRAPS.S_CLAMP:
                return gl.CLAMP;
            case Texture2DVars.S_WRAPS.S_REPEAT:
                return gl.REPEAT;
            case Texture2DVars.S_WRAPS.S_CLAMP_TO_EDGE:
                return gl.CLAMP_TO_EDGE;
            case Texture2DVars.S_WRAPS.S_CLAMP_TO_BORDER:
                return gl.CLAMP_TO_BORDER;
        }
        return null;
    }

    /**
     * 设置纹理边缘处理。<br/>
     * @param {Scene}[scene]
     * @param {Number}[texEnum]
     * @param {Number}[wrap]
     * @private
     */
    _setWrap(scene, texEnum, wrap){
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.texParameteri(gl.TEXTURE_2D, texEnum, wrap);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * 设置预设颜色值,由于web纹理需要异步加载,所以可以提供一个预设颜色纹理。<br/>
     * @param {Scene}[scene]
     * @param {Vector4}[value]
     */
    setPreloadColor(scene, value){
        let color = Texture2DVars._S_TEMP_COLOR.getArray();
        if (!value) {
            color[0] = 0;
            color[1] = 0;
            color[2] = 0;
            color[3] = 255;
        } else {
            color[0] = Math.floor(value._m_X * 255);
            color[1] = Math.floor(value._m_Y * 255);
            color[2] = Math.floor(value._m_Z * 255);
            color[3] = Math.floor(value._m_W * 255);
        }
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, this._m_Internalformat, 1, 1, 0, this._m_Format, this._m_Type, Texture2DVars._S_TEMP_COLOR.getBufferData());
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * 设置纹理图素路径。<br/>
     * @param {Scene}[scene]
     * @param {String}[src]
     * @param {Boolean}[options.linearFloat 表示rgbe数据的辐射度纹理为线性空间]
     * @param {Boolean}[options.rgbe 表示rgbe数据的辐射度纹理]
     */
    setImageSrc(scene, src, options){
        // 加载完毕设置纹理图素
        let image = (options && options.rgbe) ? RadianceLoader.rgbeImg() : new Image();
        image.onload = ()=>{
            // 某些图形驱动api规范仅支持2的幂次方
            // image = Tools.ensureImageSizePowerOfTwo(image, scene.getCanvas());
            this._m_Image = (options && options.rgbe) ? (options.linearFloat ? image.dataFloat : image.dataRGBE) : image;
            if(options && options.rgbe){
                this._m_Rgbe = true;
            }
            this._m_Width = image.width;
            this._m_Height = image.height;
            this._m_UpdateImage = true;
            // //self._image = image; // 为了更快的 WebGL 上下文恢复 - 内存效率低下
            // this.setImage(scene, image);
            // // 为该image生成硬件mipmap
            // this.genMipmap(scene);
            // // 设置默认纹理滤波
            // const gl = scene.getCanvas().getGLContext();
            // this.setFilter(scene, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            // this.setFilter(scene, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            // 刷新所有材质持有
            for(let owner in this._m_OwnerFlags){
                this._m_OwnerFlags[owner].owner.setParam(this._m_OwnerFlags[owner].flag, this);
            }
        };
        image.src = src;
    }

    /**
     * 直接设置已加载的图像数据。<br/>
     * @param {Scene}[scene]
     * @param {BufferData}[imgData]
     * @param {Boolean}[options.rgbe 表示rgbe数据的辐射度纹理]
     * @param {Boolean}[options.linearFloat 表示rgbe数据的辐射度纹理为线性空间]
     * @param {Number}[options.width 当imgData是二进制数据数组时,需要单独设置纹理宽度]
     * @param {Number}[options.height 当imgData是二进制数据数组时,需要单独设置纹理高度]
     */
    setImage(scene, imgData, options){
        this._m_Image = (options && options.rgbe) ? (options.linearFloat ? imgData.dataFloat : imgData.dataRGBE) : imgData;
        if(options && options.rgbe){
            this._m_Rgbe = true;
        }
        this._m_Width = (options && options.width != null) ? options.width : imgData.width;
        this._m_Height = (options && options.height != null) ? options.height : imgData.height;
        this._m_UpdateImage = true;
        // 刷新所有材质持有
        for(let owner in this._m_OwnerFlags){
            this._m_OwnerFlags[owner].owner.setParam(this._m_OwnerFlags[owner].flag, this);
        }
    }

    /**
     * 设置纹理的图素数据。<br/>
     * @param {Scene}[scene]
     * @param {ImgData}[image]
     * @param props
     */
    _setImage(scene, image, props) {
        const gl = scene.getCanvas().getGLContext();
        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this._m_FlipY);
        if(this._m_Rgbe){
            gl.texImage2D(gl.TEXTURE_2D, 0, this._m_Internalformat, this._m_Width, this._m_Height, 0, this._m_Format, this._m_Type, image);
        }
        else{
            gl.texImage2D(gl.TEXTURE_2D, 0, this._m_Internalformat, this._m_Width, this._m_Height, 0, this._m_Format, this._m_Type, image);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    _upload(gl, loc, fun){
        gl.activeTexture(gl.TEXTURE0 + loc);

        if(this._m_UpdateImage){
            // 某些图形驱动api规范仅支持2的
            //self._image = image; // 为了更快地恢复WebGL上下文-内存效率低下？
            this._setImage(this._m_Scene, this._m_Image);
            // 为该image生成硬件mipmap
            if(this._m_MinFilter != Texture2DVars.S_FILTERS.S_NEAREST && this._m_MinFilter != Texture2DVars.S_FILTERS.S_LINEAR){
                this.genMipmap(this._m_Scene);
            }
            this.updateTextureFilter();
            this._m_UpdateImage = false;
            this._m_ImageSource = this._m_Image;
            this._m_Image = null;
            this._m_Width = this._m_Height = -1;
            this._m_Rgbe = false;
        }

        gl.bindTexture(gl.TEXTURE_2D, this._m_Texture);
    }

    /**
     * 暂时未想好比较方式。<br/>
     * @param {Texture2DVars}[texture2DVars]
     * @return {Boolean}
     */
    compare(texture2DVars){
        return false;
    }

}

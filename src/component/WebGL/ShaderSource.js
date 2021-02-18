/**
 * 着色器源码,定义一个着色器程序源码,一个着色器程序至少应该包含vertex_shader源码和fragment_shader源码。<br/>
 * @author Kkk
 */
export default class ShaderSource {
    static VERTEX_SHADER = "vertex_shader";
    static FRAGMENT_SHADER = "fragment_shader";
    static SOURCE_ENUM = {"vertex_shader":"vertex_shader","fragment_shader":"fragment_shader"};


    // 枚举,这些是作为引擎内置可能存在的输入属性，变量
    static S_POSITION = 0x001;
    static S_COLOR = 0x002;
    static S_NORMAL = 0x003;
    static S_TANGENT = 0x004;
    static S_UV0 = 0x005;
    static S_UV1 = 0x006;
    static S_UV2 = 0x007;
    static S_UV3 = 0x008;
    static S_MODEL_MATRIX = 0x009;
    static S_VIEW_MATRIX = 0x010;
    static S_PROJECT_MATRIX = 0x011;
    static S_MVP = 0x012;
    static S_MV = 0x013;
    static S_VP = 0x014;
    static S_NDP = 0x015;
    static S_G_POSITION = 0;
    static S_G_NORMAL = 1;
    static S_G_ALBEDOSPEC = 2;
    static S_G_DEPTH = 3;


    static S_POSITION_SRC = "_position";
    static S_COLOR_SRC = "_color";
    static S_NORMAL_SRC = "_normal";
    static S_TANGENT_SRC = "_tangent";
    static S_UV0_SRC = "_uv0";
    static S_UV1_SRC = "_uv1";
    static S_UV2_SRC = "_uv2";
    static S_UV3_SRC = "_uv3";
    static S_OUT_COLOR = "_outColor";
    static S_OUT_POSITION = "gl_Position";
    static S_MODEL_MATRIX_SRC = "_model_matrix";
    static S_VIEW_MATRIX_SRC = "_view_matrix";
    static S_PROJECT_MATRIX_SRC = "_project_matrix";
    static S_MVP_SRC = "_model_view_project_matrix";
    static S_MV_SRC = "_model_view_matrix";
    static S_VP_SRC = "_view_project_matrix";
    static S_NDP = "";

    // 灯光系统
    static S_LIGHT_DATA_SRC = '_lightData';
    static S_CUR_LIGHT_COUNT_SRC = '_curLightCount';
    static S_NB_LIGHTS = '_NB_LIGHTS';
    static S_BATCH_LIGHT_SIZE = 4;

    static S_G_POSITION_SRC = "_gPosition";
    static S_G_NORMAL_SRC = "_gNormal";
    static S_G_ALBEDOSPEC_SRC = "_gAlbedoSpec";
    // 纹理深度(目前webGL2.0不支持深度纹理,但作为标记,仍然在这里提供)
    static S_G_DEPTH_SRC = "_gDepth";
    static S_G_DEPTH_RENDER_BUFFER_SRC = "_gDepthRenderBuffer";

    static S_FORWARD_COLOR_MAP_SRC = "_forwardColorMap";

    // 上下文块
    static ContextBlocks = {
        S_VIEW_MATRIX_SRC:true,
        S_PROJECT_MATRIX_SRC:true,
        S_VP_SRC:true
    };
    static MAT = 'layout (std140) uniform MAT\n' +
        '{\n' +
        'mat4 ' + ShaderSource.S_VIEW_MATRIX_SRC + ';\n' +
        'mat4 ' + ShaderSource.S_PROJECT_MATRIX_SRC + ';\n' +
        'mat4 ' + ShaderSource.S_VP_SRC + ';\n' +
        '};\n';
    static BLOCKS = {
        'MAT':{blockIndex:0x001, blockDef:ShaderSource.MAT},
    };
    static Context_RenderDataRefFBs = {
        "_gPosition":'DefaultDeferredShadingFrameBuffer',
        "_gNormal":'DefaultDeferredShadingFrameBuffer',
        "_gAlbedoSpec":'DefaultDeferredShadingFrameBuffer',
        "_gDepth":'DefaultDeferredShadingFrameBuffer',
        "_forwardColorMap":'DefaultForwardShadingFrameBuffer',
    };

    // 上下文数据
    static Context_Data = {
        "Context.InPosition":{src:ShaderSource.S_POSITION_SRC, loc:ShaderSource.S_POSITION, pattern:/Context.InPosition/, tagPattern:/Context.InPosition/g, tag:"_position", type:"vec3"},
        "Context.InUv0":{src:ShaderSource.S_UV0_SRC, loc:ShaderSource.S_UV0, pattern:/Context.InUv0/, tagPattern:/Context.InUv0/g, tag:ShaderSource.S_UV0_SRC, type:"vec2"},
        "Context.OutPosition":{src:ShaderSource.S_OUT_POSITION, pattern:/Context.OutPosition/, tagPattern:/Context.OutPosition/g, tag:"gl_Position"},
        "Context.ProjectViewModelMatrix":{src:ShaderSource.S_MVP_SRC, pattern:/Context.ProjectViewModelMatrix/, tagPattern:/Context.ProjectViewModelMatrix/g, tag:"_model_view_project_matrix", type:"mat4", utype:"uniform mat4"},
        "Context.ViewMatrix":{src:ShaderSource.S_VIEW_MATRIX_SRC, pattern:/Context.ViewMatrix/, tagPattern:/Context.ViewMatrix/g, tag:ShaderSource.S_VIEW_MATRIX_SRC, def:'MAT'},
        "Context.ProjectMatrix":{src:ShaderSource.S_PROJECT_MATRIX_SRC, pattern:/Context.ProjectMatrix/, tagPattern:/Context.ProjectMatrix/g, tag:ShaderSource.S_PROJECT_MATRIX_SRC, def:'MAT'},
        "Context.ModelMatrix":{src:ShaderSource.S_MODEL_MATRIX_SRC, pattern:/Context.ModelMatrix/, tagPattern:/Context.ModelMatrix/g, tag:ShaderSource.S_MODEL_MATRIX_SRC, type:"mat4", utype:"uniform mat4"},
        "Context.ProjectViewMatrix":{src:ShaderSource.S_VP_SRC, pattern:/Context.ProjectViewMatrix/, tagPattern:/Context.ProjectViewMatrix/g, tag:ShaderSource.S_VP_SRC, def:'MAT'},
        "Context.OutColor":{src:ShaderSource.S_OUT_COLOR, pattern:/Context.OutColor/, tagPattern:/Context.OutColor/g, tag:"_outColor", type:"out vec4"},
        "Context.LightData":{src:ShaderSource.S_LIGHT_DATA_SRC, pattern:/Context.ModelMatrix/, tagPattern:/Context.ModelMatrix/g, tag:ShaderSource.S_MODEL_MATRIX_SRC, type:"vec4", utype:"uniform vec4", modifier:'[' + ShaderSource.S_BATCH_LIGHT_SIZE + ']'},
        "Context.CurLightCount":{src:ShaderSource.S_CUR_LIGHT_COUNT_SRC, pattern:/Context.CurLightCount/, tagPattern:/Context.CurLightCount/g, tag:ShaderSource.S_CUR_LIGHT_COUNT_SRC, type:"int", utype:'uniform int'},

        // 输入类型缓存
        "Context.InGPosition":{src:ShaderSource.S_G_POSITION_SRC, pattern:/Context.InGPosition/, tagPattern:/Context.InGPosition/g, tag:ShaderSource.S_G_POSITION_SRC, type:"sampler2D", utype:"uniform sampler2D", flag:"renderData"},
        "Context.InGNormal":{src:ShaderSource.S_G_NORMAL_SRC, pattern:/Context.InGNormal/, tagPattern:/Context.InGNormal/g, tag:ShaderSource.S_G_NORMAL_SRC, type:"sampler2D", utype:"uniform sampler2D", flag:"renderData"},
        "Context.InGAlbedoSpec":{src:ShaderSource.S_G_ALBEDOSPEC_SRC, pattern:/Context.InGAlbedoSpec/, tagPattern:/Context.InGAlbedoSpec/g, tag:ShaderSource.S_G_ALBEDOSPEC_SRC, type:"sampler2D", utype:"uniform sampler2D", flag:"renderData"},
        "Context.InGDepth":{src:ShaderSource.S_G_DEPTH_SRC, pattern:/Context.InGDepth/, tagPattern:/Context.InGDepth/g, tag:ShaderSource.S_G_DEPTH_SRC, type:"sampler2D", utype:"uniform sampler2D", flag:"renderData"},
        "Context.InForwardColorMap":{src:ShaderSource.S_FORWARD_COLOR_MAP_SRC, pattern:/Context.InForwardColorMap/, tagPattern:/Context.InForwardColorMap/g, tag:ShaderSource.S_FORWARD_COLOR_MAP_SRC, type:"sampler2D", utype:"uniform sampler2D", flag:"renderData"},
        // 输出类型缓存
        "Context.OutGPosition":{src:ShaderSource.S_G_POSITION_SRC, loc:ShaderSource.S_G_POSITION, pattern:/Context.OutGPosition/, tagPattern:/Context.OutGPosition/g, tag:ShaderSource.S_G_POSITION_SRC, type:"vec3"},
        "Context.OutGNormal":{src:ShaderSource.S_G_NORMAL_SRC, loc:ShaderSource.S_G_NORMAL, pattern:/Context.OutGNormal/, tagPattern:/Context.OutGNormal/g, tag:ShaderSource.S_G_NORMAL_SRC, type:"vec3"},
        "Context.OutGAlbedoSpec":{src:ShaderSource.S_G_ALBEDOSPEC_SRC, loc:ShaderSource.S_G_ALBEDOSPEC, pattern:/Context.OutGAlbedoSpec/, tagPattern:/Context.OutGAlbedoSpec/g, tag:ShaderSource.S_G_ALBEDOSPEC_SRC, type:"vec4"},
        "Context.OutGDepth":{src:ShaderSource.S_G_DEPTH_SRC, loc:ShaderSource.S_G_DEPTH, pattern:/Context.OutGDepth/, tagPattern:/Context.OutGDepth/g, tag:ShaderSource.S_G_DEPTH_SRC, type:"vec4"},
    };

    constructor() {
        this._m_Source = {};
    }
    set(type, src){
        if(ShaderSource.SOURCE_ENUM[type]){
            this._m_Source[type] = src;
        }
        else{
            console.error("未知着色器类型:" + type);
        }
    }
    get(type){
        if(ShaderSource.SOURCE_ENUM[type]){
            return this._m_Source[type];
        }
        else{
            console.error("未知着色器类型:" + type);
            return null;
        }
    }

}

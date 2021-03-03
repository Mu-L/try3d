import Component from "../Component.js";
import SubShaderSource from "./SubShaderSource.js";
import ShaderProgram from "../WebGL/ShaderProgram.js";
import SubShader from "./SubShader.js";
import Technology from "./Technology.js";

/**
 * 材质定义，材质定义定义了相关物体渲染时的着色材质属性，通过MaterialShaderSource完成对材质的实现。<br/>
 * @author Kkk
 */
export default class Material extends Component{
    getType(){
        return "Material";
    }
    constructor(owner, cfg) {
        super(owner, cfg);
        // // 根据当前材质类型获取对应的着色器源码定义，并生成对应的着色器程序
        // this._m_MaterialSource = new SubShaderSource(cfg.materialSourceDef);
        // // 根据materialShaderSource,创建着色器程序,然后根据材质定义,获取着色器变量
        // this._m_ShaderProgram = new ShaderProgram(this._m_Scene.getCanvas().getGLContext(), this._m_MaterialSource.getShaderSource());
        // 材质参数
        this._m_Params = {};
        // 参数值列表
        this._m_ParamValues = {};
        // 可定义材质参数
        this._m_CanDefineParams = {};
        // 已定义材质参数
        this._m_AleadyDefinedParams = {};
        // 发生变化的材质参数值
        this._m_ChangeParams = [];
        this._init();




        // 记录当前激活的subShader
        this._m_CurrentSubShader = null;
        // 记录不同路径中的Shader
        // key:TechnologyName,value:Technology
        this._m_RenderTechnologys = {};
        // 当前实用的技术
        this._m_CurrentTechnology = null;

        // 解析材质定义
        if(cfg.materialDef){
            let gl = this._m_Scene.getCanvas().getGLContext();
            // 获取技术块
            let materialDef = cfg.materialDef;
            // 开始解析
            let mp = materialDef.getParams();
            for(let p in mp){
                // 默认所有参数值为null
                this._m_ParamValues[mp[p].getName()] = null;
                this._m_Params[mp[p].getName()] = true;
                this._m_CanDefineParams[mp[p].getName()] = true;
            }
            let subShaderDefs = materialDef.getSubShaderDefs();
            let subShaders = {};
            for(let sS in subShaderDefs){
                subShaders[subShaderDefs[sS].getName()] = new SubShader(gl, cfg.frameContext || this._m_Scene.getRender().getFrameContext(), subShaderDefs[sS]);
            }
            let technologyDefs = materialDef.getTechnologyDefs();
            let technologyDef = null;
            let rpSubPass = null;
            let subPass = null;
            for(let tE in technologyDefs){
                technologyDef = technologyDefs[tE];
                this._m_RenderTechnologys[technologyDef.getName()] = new Technology(technologyDef.getName());
                rpSubPass = technologyDef.getSubPass();
                for(let renderPath in rpSubPass){
                    subPass = rpSubPass[renderPath];
                    subPass.forEach(sub=>{
                        sub.getPass().forEach(pass=>{
                            // 这里,原本的思路是直接建立renderPath->subShader[]
                            // 但是为了完整性,这里使用了renderPath->subPass(包含一个subShader[])
                            // 其中每个subShader可以指定使用的FB
                            this._m_RenderTechnologys[technologyDef.getName()].addSubPass(renderPath, subShaders[pass.pass.getName()], pass.renderState);
                        });
                        // this._m_RenderTechnologys[technologyDef.getName()].addSubShader(renderPath, subShaders[sub.pass.getName()]);
                    });
                }
            }
            // 设置默认技术
            this.selectTechnology("");
        }
        else{
            // 错误
            console.log("找不到materialDef...");
        }
    }
    getRenderTechnology(renderPathType){
        return this._m_RenderTechnologys.get(renderPathType);
    }

    /**
     * 添加一个技术。<br/>
     * @param {String}[technologyName 技术名称]
     * @param {String}[technology 技术]
     */
    addTechnology(technologyName, technology){
        this._m_RenderTechnologys[technologyName] = technology;
    }

    /**
     * 选中指定技术作为该材质渲染。<br/>
     * @param {String}[technologyName Technology名称]
     */
    selectTechnology(technologyName){
        this._m_CurrentTechnology = this._m_RenderTechnologys[technologyName];
    }

    /**
     * 返回当前选中的技术。<br/>
     * @return {Technology}
     */
    getCurrentTechnology(){
        return this._m_CurrentTechnology;
    }

    /**
     * 使用指定subShader进行材质着色。<br/>
     * @param {SubShader}[subShader]
     */
    _selectSubShader(subShader){
        this._m_CurrentSubShader = subShader;
        let gl = this._m_Scene.getCanvas().getGLContext();
        let frameContext = this._m_Scene.getRender().getFrameContext();
        // 检测是否需要重新编译subShader
        if(this._m_CurrentSubShader.needCompile()){
            this._m_CurrentSubShader._compile(gl, frameContext);
        }
        // 1.先检测是否需要切换subShader(根据shader种类)(这里检测可能与理论不一样，打印出id来调试...)
        if(frameContext.m_LastSubShaderId != subShader.getDefId()){
            // 切换
            subShader.use(gl);
            frameContext.m_LastSubShaderId = subShader.getDefId();
        }
        // 2.检测是否需要更新参数到subShader中(同种类型subShaderId,但存在不同具体实力化subShader对象,所以参数不同需要更新)
        if(frameContext.m_LastSubShader != subShader){
            frameContext.m_LastSubShader = subShader;
            // 先检查材质值
            for(let n in this._m_ParamValues){
                // 有些参数值为null
                if(this._m_ParamValues[n]){
                    // 提交参数
                    this._m_CurrentSubShader.uploadParam(gl, n, this._m_ParamValues[n]);
                }
            }
            // 检查最新数据值
            if(this._m_ChangeParams.length > 0){
                this._m_ChangeParams.forEach(param=>{
                    // 检测是否需要更新该参数
                    if(this._m_ParamValues[param.paramName]){
                        // 如果值相同就跳过
                        if(!this._m_ParamValues[param.paramName].compare(param.value)){
                            // 提交参数并保存参数
                            this._m_CurrentSubShader.uploadParam(gl, param.paramName, param.value);
                            this._m_ParamValues[param.paramName] = param.value;
                        }
                    }
                    else{
                        // 提交参数并保存参数
                        this._m_CurrentSubShader.uploadParam(gl, param.paramName, param.value);
                        this._m_ParamValues[param.paramName] = param.value;
                    }
                });
                this._m_ChangeParams.length = 0;
            }
            // 更新参数到subShader中?
            // modelMatrix,蒙皮骨骼变换这些信息,只能由具体的Geometry去传递,所以应该在Geometry中更新modelMatrix,但由于是提交数据时仅需要local,所以Geometry需要持有mat SubShader,这样才能直到更新到哪个shader句柄中。
            // 而灯光的一些信息,应该由灯光模块系统去执行更新(如果使用ubo block,则可以不需要引用mat就可以独立更新,mat subShader只需要绑定指定的ubo block即可)

            // for(let paramName in subShader.getParams()){
            //     if(subShader.getParamValue(paramName) != this._m_Params[paramName]){
            //         // 更新新的值到subShader中
            //     }
            // }

        }
    }
    _init(){
        // let gl = this._m_Scene.getCanvas().getGLContext();
        // this.use();
        // let mI = gl.getUniformLocation(this._m_ShaderProgram.getProgram(), "modelMatrix");
        // gl.uniformMatrix4fv(mI, false, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
        // let ubi = gl.getUniformBlockIndex(this._m_ShaderProgram.getProgram(), "VP");
        // gl.uniformBlockBinding(this._m_ShaderProgram.getProgram(), ubi, 0x001);
        // gl.useProgram(null);
    }

    /**
     * 设置参数。<br/>
     * @param {String}[paramName 参数名]
     * @param {Vars}[value 参数值]
     */
    setParam(paramName, value){
        // 检测是否有效参数
        if(this._m_Params[paramName]){
            // 检测是否已经定义
            if(!this._m_AleadyDefinedParams[paramName]){
                // 定义该参数
                // 重新构建当前技术所有SubShader块
                let subPass = null;
                for(let p in this._m_CurrentTechnology.getSubPassList()){
                    subPass = this._m_CurrentTechnology.getSubPasss(p);
                    subPass.getSubShaders().forEach(sb=>{
                        sb.subShader.addDefine(paramName);
                    });
                }
                this._m_AleadyDefinedParams[paramName] = true;
            }
            // 将其加入参数列表
            this._m_ChangeParams.push({paramName, value});
        }
    }

}
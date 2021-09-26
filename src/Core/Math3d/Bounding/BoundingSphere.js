import BoundingVolume from "./BoundingVolume.js";
import Plane from "../Plane.js";

/**
 * BoundingSphere。<br/>
 * 包围球(边界球)定义一组顶点的的边界范围，通常用于更快的边界计算（比如求交，初步碰撞），<br/>
 * 可以使用一组范围顶点数据初始化边界球，或通过其他BoundingVolume获取边界球。<br/>
 * @author Kkk
 * @date 2021年3月20日15点50分
 */
export default class BoundingSphere extends BoundingVolume{
    static _S_RADIUS_EPSILON = 1.0 + 0.00001;
    constructor(props) {
        super(props);
        // 半径
        this._m_Radius = 0;
    }

    /**
     * 设置半径。<br/>
     * @param radius
     */
    setRaiuds(radius){
        this._m_Radius = radius;
    }

    /**
     * 返回半径。<br/>
     * @return {number}
     */
    getRadius(){
        return this._m_Radius;
    }
    getType() {
        return BoundingVolume.S_TYPE_SPHERE;
    }
    /**
     * 返回处于平面的哪一边。<br/>
     * @param {Plane}[plane]
     * @return {Number}[GroupPlane.S_SIDE_POSITIVE/GroupPlane.S_SIDE_NEGATIVE/GroupPlane.NONE]
     */
    whichSide(plane){
        let distance = plane.distance(this._m_Center);

        if(distance > this._m_Radius){
            return Plane.S_SIDE_POSITIVE;
        }
        else if(distance < -this._m_Radius){
            return Plane.S_SIDE_NEGATIVE;
        }
        return Plane.S_SIDE_NONE;
    };

}

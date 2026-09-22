// 数学三 · 章节配方（15 章）
import { limits, deriv, integral, multi, doubleInt, series, ode, laDet, laMat, laVec, laSys, laEig, laQuad, probEvt, probDist, probJoint, probMom, probLLN, stat } from "./gen-common.mjs";

export default [
  ...limits("函数、极限与连续"),
  ...deriv("一元函数微分学"),
  ...integral("一元函数积分学"),
  ...multi("多元函数微分学"),
  ...doubleInt("二重积分"),
  ...series("无穷级数"),
  ...ode("微分方程"),
  ...laDet("行列式与矩阵"),
  ...laMat("行列式与矩阵"),
  ...laVec("向量与线性方程组"),
  ...laSys("向量与线性方程组"),
  ...laEig("特征值、特征向量与二次型"),
  ...laQuad("特征值、特征向量与二次型"),
  ...probEvt("随机事件与概率"),
  ...probDist("随机变量及其分布"),
  ...probJoint("多维随机变量"),
  ...probMom("数字特征与极限定理"),
  ...probLLN("数字特征与极限定理"),
  ...stat("数理统计"),
];

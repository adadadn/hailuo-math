// 396 经济类联考 · 章节配方（10 章）
import { limits, deriv, integral, multi, doubleInt, laDet, laMat, laVec, laSys, laEig, laQuad, probEvt, probDist, probMom, stat } from "./gen-common.mjs";

export default [
  ...limits("函数、极限与连续"),
  ...deriv("一元函数微分学"),
  ...integral("一元函数积分学"),
  ...multi("多元函数与微积分应用"),
  ...doubleInt("多元函数与微积分应用"),
  ...laDet("行列式与矩阵"),
  ...laMat("行列式与矩阵"),
  ...laVec("向量与线性方程组"),
  ...laSys("向量与线性方程组"),
  ...laEig("特征值与二次型"),
  ...laQuad("特征值与二次型"),
  ...probEvt("随机事件与概率"),
  ...probDist("随机变量及其分布"),
  ...probMom("数字特征与统计基础"),
  ...stat("数字特征与统计基础"),
];

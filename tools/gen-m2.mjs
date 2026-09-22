// 数学二 · 章节配方（12 章）
import { limits, deriv, integral, multi, doubleInt, ode, laDet, laMat, laVec, laSys, laEig, laQuad } from "./gen-common.mjs";

export default [
  ...limits("函数、极限与连续"),
  ...deriv("一元函数微分学"),
  ...integral("一元函数积分学"),
  ...multi("多元函数微分学"),
  ...doubleInt("二重积分"),
  ...ode("微分方程"),
  ...laDet("行列式"),
  ...laMat("矩阵"),
  ...laVec("向量"),
  ...laSys("线性方程组"),
  ...laEig("特征值与特征向量"),
  ...laQuad("二次型"),
];

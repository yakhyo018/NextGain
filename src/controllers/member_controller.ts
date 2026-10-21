import { NextFunction, Request, Response } from "express";
import { T } from "../libs/types/common";
import MemberService from "../models/Member.service";
import {
  ExtendedRequest,
  LoginInput,
  Member,
  MemberInput,
  MemberUpdateInput,
} from "../libs/types/member";
import Errors, { HttpCode, Message } from "../libs/Errors";
import AuthService from "../models/Auth.service";
import { AUTH_TIMER, COOKIE_DOMAIN } from "../libs/config";
import { log } from "console";
import { accessSync } from "fs";

const memberService = new MemberService();
const authService = new AuthService();

const memberContoller: T = {};

memberContoller.getStore = async (req: Request, res: Response) => {
  try {
    console.log("getRestaurant");
    const result = await memberService.getStore();

    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getRestaurant", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standards.code).json(Errors.standards);
  }
};

memberContoller.Signup = async (req: Request, res: Response) => {
  try {
    console.log("Signup");
    const input: MemberInput = req.body,
      result: Member = await memberService.Signup(input),
      token = await authService.createToken(result);

    res.cookie("accessToken", token, {
      maxAge: AUTH_TIMER * 3600 * 1000,
      httpOnly: false,
      domain: COOKIE_DOMAIN,
    });

    res.status(HttpCode.CREATED).json({ member: result, accessToken: token });
  } catch (err) {
    console.log("Error, Signup", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standards.code).json(Errors.standards);
  }
};

memberContoller.Login = async (req: Request, res: Response) => {
  try {
    console.log("Login");
    const input: LoginInput = req.body,
      result = await memberService.Login(input),
      token = await authService.createToken(result);

    res.cookie("accessToken", token, {
      maxAge: AUTH_TIMER * 3600 * 1000,
      httpOnly: false,
      domain: COOKIE_DOMAIN,
    });

    res.status(HttpCode.OK).json({ member: result, accessToken: token });
  } catch (err) {
    console.log("Error, Login", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standards.code).json(Errors.standards);
  }
};

memberContoller.logout = (req: ExtendedRequest, res: Response) => {
  try {
    console.log("logout");
    res.cookie("accessToken", null, {
      maxAge: 0,
      httpOnly: true,
      // must match the domain it was set with, or the browser keeps it
      domain: COOKIE_DOMAIN,
    });
    res.status(HttpCode.OK).json({ logout: true });
  } catch (err) {
    console.log("Error, logout", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standards.code).json(Errors.standards);
  }
};

memberContoller.getMemberDetail = async (
  req: ExtendedRequest,
  res: Response,
) => {
  try {
    console.log("getMemberDetail");
    const result = await memberService.getMemberDetail(req.member);

    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getMemberDetail", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standards.code).json(Errors.standards);
  }
};

/**
 * @claude-change — guard the two unique fields.
 *
 * memberNick and memberPhone carry `unique: true, sparse: true` in
 * Member.model. Writing "" into them does not skip the index (only a missing
 * field does), so the second member whose phone became "" hits an E11000
 * duplicate key error, which surfaced as a plain 500 on My Page.
 */
memberContoller.updateMember = async (req: ExtendedRequest, res: Response) => {
  try {
    console.log("updateMember");
    const input: MemberUpdateInput = { ...req.body };

    // an empty identity field means "leave it as it is", never "blank it"
    if (!String(input.memberNick ?? "").trim()) delete input.memberNick;
    if (!String(input.memberPhone ?? "").trim()) delete input.memberPhone;

    if (req.file) input.memberImage = req.file.path;

    if (Object.keys(input).length === 0)
      throw new Errors(HttpCode.BAD_REQUEST, "Nothing was sent to update!");

    console.log("  update input:", input);

    const result = await memberService.updateMember(req.member, input);

    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, updateMember", err);

    // a duplicate key is a client mistake, not a server fault -- say which
    // field collided instead of returning a bare 500
    const mongoErr = err as { code?: number; keyPattern?: Record<string, 1> };
    if (mongoErr?.code === 11000) {
      const field = Object.keys(mongoErr.keyPattern ?? {})[0] ?? "value";
      return res
        .status(HttpCode.BAD_REQUEST)
        .json({ code: HttpCode.BAD_REQUEST, message: `This ${field} is already taken!` });
    }

    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standards.code).json(Errors.standards);
  }
};

memberContoller.getTopUSers = async (req: Request, res: Response) => {
  try {
    console.log("getTopUSers");
    const result = await memberService.getTopUsers();

    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getTopUSers", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standards.code).json(Errors.standards);
  }
};

memberContoller.verifyAuth = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies["accessToken"];
    if (token) req.member = await authService.checkAuth(token);

    if (!req.member)
      throw new Errors(HttpCode.UNAUTHORIZED, Message.NOT_AUTHENTICATED);

    next();
  } catch (err) {
    console.log("Error, verifyAuth", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standards.code).json(Errors.standards);
  }
};

memberContoller.retrieveAuth = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies["accessToken"];
    if (token) req.member = await authService.checkAuth(token);
    next();
  } catch (err) {
    console.log("Error, retrieveAuth", err);
    next();
  }
};

export default memberContoller;

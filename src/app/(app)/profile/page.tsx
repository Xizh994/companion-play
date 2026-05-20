"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Store, Shield, Check, Clock, XCircle, Mail, Phone, Lock, Camera, ArrowLeft, X, Pencil, Loader2, ZoomIn, ZoomOut, MapPin, User, PhoneCall, FileText, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { maskPhone, maskEmail } from "@/lib/mask";
import { isValidIdCardNumber } from "@/lib/id-card";
import {
  getBossVerifyView,
  getShopVerifyView,
  getVerifyBadgeClass,
  getVerifyPanelClass,
  getVerifyTextClass,
  formatVerificationNotesForDisplay,
} from "@/lib/verification-ui";

const CROP_SIZE = 280;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function formatLicenseType(raw: unknown): string {
  if (typeof raw !== "string") return "营业执照";
  switch (raw) {
    case "business_license": return "营业执照";
    case "individual_biz": return "个体工商户";
    case "org_code": return "组织机构代码证";
    default: return raw;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, refreshUser, logout } = useAuth();

  const [showRealName, setShowRealName] = useState(false);
  const [realName, setRealName] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<"enter" | "verify-phone" | "enter-new" | "verify-new">("enter");
  const [newEmail, setNewEmail] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [phoneVerifiedToken, setPhoneVerifiedToken] = useState("");
  const [emailVerifiedToken, setEmailVerifiedToken] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameValue, setNicknameValue] = useState(user?.nickname || "");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const sp = user?.shopProfile as Record<string, unknown> | null | undefined;
  const [editingShopField, setEditingShopField] = useState<string | null>(null);
  const [shopNameValue, setShopNameValue] = useState((sp?.shopName as string) || "");
  const [shopDescValue, setShopDescValue] = useState((sp?.shopDesc as string) || "");
  const [shopAddressValue, setShopAddressValue] = useState((sp?.shopAddress as string) || "");
  const [shopInfoSaving, setShopInfoSaving] = useState(false);

  const [contactNameModalOpen, setContactNameModalOpen] = useState(false);
  const [contactNamePicked, setContactNamePicked] = useState("");
  const [contactNameRealName, setContactNameRealName] = useState("");
  const [contactNameIdCard, setContactNameIdCard] = useState("");
  const [contactNameVerifying, setContactNameVerifying] = useState(false);
  const [contactNameError, setContactNameError] = useState("");
  const [contactNameDone, setContactNameDone] = useState(false);

  const [contactPhoneModalOpen, setContactPhoneModalOpen] = useState(false);
  const [contactPhonePicked, setContactPhonePicked] = useState("");
  const [contactPhoneCode, setContactPhoneCode] = useState("");
  const [contactPhoneSent, setContactPhoneSent] = useState(false);
  const [contactPhoneCountdown, setContactPhoneCountdown] = useState(0);
  const [contactPhoneVerifiedToken, setContactPhoneVerifiedToken] = useState("");
  const [contactPhoneLoading, setContactPhoneLoading] = useState(false);
  const [contactPhoneError, setContactPhoneError] = useState("");

  const [shopVerifySubmitting, setShopVerifySubmitting] = useState(false);
  const [shopVerifyError, setShopVerifyError] = useState("");
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [resubmitLicenseUrl, setResubmitLicenseUrl] = useState<string | null>(null);
  const [resubmitPreview, setResubmitPreview] = useState<string | null>(null);
  const [resubmitUploading, setResubmitUploading] = useState(false);
  const [resubmitSubmitting, setResubmitSubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState("");
  const resubmitLicenseInputRef = useRef<HTMLInputElement>(null);

  const saveShopField = async (field: string, value: string) => {
    setShopInfoSaving(true);
    setProfileError("");
    try {
      const formData = new FormData();
      formData.append(field, value);
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      await refreshUser();
      setEditingShopField(null);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setShopInfoSaving(false);
    }
  };

  const openContactNameModal = () => {
    setContactNamePicked((sp?.contactName as string) || "");
    setContactNameRealName("");
    setContactNameIdCard("");
    setContactNameError("");
    setContactNameDone(false);
    setContactNameModalOpen(true);
  };

  const handleSubmitContactName = async () => {
    setContactNameError("");
    const picked = contactNamePicked.trim();
    if (!picked) { setContactNameError("请输入新负责人姓名"); return; }
    if (!contactNameRealName) { setContactNameError("请输入您的真实姓名"); return; }
    if (!contactNameIdCard) { setContactNameError("请输入您的身份证号"); return; }
    if (!isValidIdCardNumber(contactNameIdCard)) {
      setContactNameError("身份证号格式不正确");
      return;
    }

    setContactNameVerifying(true);
    try {
      const res = await fetch("/api/verification/contact-person", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactName: picked,
          realName: contactNameRealName,
          idCardNumber: contactNameIdCard,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更换负责人失败");

      await refreshUser();
      setContactNameDone(true);
    } catch (err) {
      setContactNameError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setContactNameVerifying(false);
    }
  };

  const openContactPhoneModal = () => {
    setContactPhonePicked("");
    setContactPhoneCode("");
    setContactPhoneSent(false);
    setContactPhoneCountdown(0);
    setContactPhoneVerifiedToken("");
    setContactPhoneError("");
    setContactPhoneModalOpen(true);
  };

  const handleSendContactPhoneCode = async () => {
    if (contactPhoneCountdown > 0) return;
    const picked = contactPhonePicked.trim();
    if (!picked || !/^1\d{10}$/.test(picked)) { setContactPhoneError("请输入正确的手机号"); return; }
    setContactPhoneError("");
    setContactPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/send-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: picked, purpose: "changePhone" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContactPhoneSent(true);
      setContactPhoneCountdown(60);
    } catch (err) {
      setContactPhoneError(err instanceof Error ? err.message : String(err));
    } finally {
      setContactPhoneLoading(false);
    }
  };

  const handleVerifyContactPhone = async () => {
    if (!contactPhoneCode) { setContactPhoneError("请输入验证码"); return; }
    setContactPhoneError("");
    setContactPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/verify-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: contactPhonePicked, code: contactPhoneCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContactPhoneVerifiedToken(data.verifiedToken);
    } catch (err) {
      setContactPhoneError(err instanceof Error ? err.message : String(err));
    } finally {
      setContactPhoneLoading(false);
    }
  };

  const handleSubmitContactPhone = async () => {
    if (!contactPhoneVerifiedToken) { setContactPhoneError("验证已过期，请重新验证"); return; }
    setContactPhoneError("");
    setContactPhoneLoading(true);
    try {
      const formData = new FormData();
      formData.append("contactPhone", contactPhonePicked);
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      await refreshUser();
      setContactPhoneModalOpen(false);
    } catch (err) {
      setContactPhoneError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setContactPhoneLoading(false);
    }
  };

  // contact phone countdown
  useEffect(() => {
    if (contactPhoneCountdown <= 0) return;
    const t = setTimeout(() => setContactPhoneCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [contactPhoneCountdown]);

  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneStep, setPhoneStep] = useState<"verify-current" | "enter-new" | "verify-new">("verify-current");
  const [newPhone, setNewPhone] = useState("");
  const [currentPhoneCode, setCurrentPhoneCode] = useState("");
  const [newPhoneCode, setNewPhoneCode] = useState("");
  const [currentPhoneVerifiedToken, setCurrentPhoneVerifiedToken] = useState("");
  const [newPhoneVerifiedToken, setNewPhoneVerifiedToken] = useState("");
  const [currentPhoneSent, setCurrentPhoneSent] = useState(false);
  const [newPhoneSent, setNewPhoneSent] = useState(false);
  const [currentPhoneCountdown, setCurrentPhoneCountdown] = useState(0);
  const [newPhoneCountdown, setNewPhoneCountdown] = useState(0);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropDragging, setCropDragging] = useState(false);
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 });
  const [cropUploading, setCropUploading] = useState(false);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const isBinding = !user?.email;

  useEffect(() => { refreshUser(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phoneCountdown <= 0) return;
    const t = setTimeout(() => setPhoneCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phoneCountdown]);

  useEffect(() => {
    if (emailCountdown <= 0) return;
    const t = setTimeout(() => setEmailCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [emailCountdown]);

  useEffect(() => {
    if (currentPhoneCountdown <= 0) return;
    const t = setTimeout(() => setCurrentPhoneCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [currentPhoneCountdown]);

  useEffect(() => {
    if (newPhoneCountdown <= 0) return;
    const t = setTimeout(() => setNewPhoneCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [newPhoneCountdown]);

  useEffect(() => {
    if (cropModalOpen || emailModalOpen || phoneModalOpen || contactNameModalOpen || contactPhoneModalOpen || resubmitModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [cropModalOpen, emailModalOpen, phoneModalOpen, contactNameModalOpen, contactPhoneModalOpen, resubmitModalOpen]);

  const closeEmailModal = useCallback(() => {
    setEmailModalOpen(false);
    setEmailStep("enter");
    setNewEmail("");
    setPhoneCode("");
    setEmailCode("");
    setPhoneVerifiedToken("");
    setEmailVerifiedToken("");
    setPhoneCodeSent(false);
    setEmailCodeSent(false);
    setPhoneCountdown(0);
    setEmailCountdown(0);
    setEmailError("");
  }, []);

  const closePhoneModal = useCallback(() => {
    setPhoneModalOpen(false);
    setPhoneStep("verify-current");
    setNewPhone("");
    setCurrentPhoneCode("");
    setNewPhoneCode("");
    setCurrentPhoneVerifiedToken("");
    setNewPhoneVerifiedToken("");
    setCurrentPhoneSent(false);
    setNewPhoneSent(false);
    setCurrentPhoneCountdown(0);
    setNewPhoneCountdown(0);
    setPhoneError("");
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setProfileError("头像大小不能超过 5MB"); return; }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) { setProfileError("仅支持 JPG/PNG/WebP/GIF 格式"); return; }
    setProfileError("");

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setCropImage(img);
        setCropImageSrc(reader.result as string);
        const scale = Math.min(CROP_SIZE / img.width, CROP_SIZE / img.height, 1);
        setCropScale(scale);
        setCropOffset({ x: 0, y: 0 });
        setCropModalOpen(true);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setCropDragging(true);
    setCropDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
  };

  const handleCropTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setCropDragging(true);
    setCropDragStart({ x: e.touches[0].clientX - cropOffset.x, y: e.touches[0].clientY - cropOffset.y });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!cropDragging) return;
    setCropOffset({ x: e.clientX - cropDragStart.x, y: e.clientY - cropDragStart.y });
  };

  const handleCropTouchMove = (e: React.TouchEvent) => {
    if (!cropDragging || e.touches.length !== 1) return;
    setCropOffset({ x: e.touches[0].clientX - cropDragStart.x, y: e.touches[0].clientY - cropDragStart.y });
  };

  const handleCropMouseUp = () => {
    setCropDragging(false);
  };

  const handleCropWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setCropScale((s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s + delta)));
  };

  const applyCropAndUpload = async () => {
    if (!cropImage) return;
    setCropUploading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = CROP_SIZE;
      canvas.height = CROP_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("无法创建画布");

      ctx.beginPath();
      ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();

      const scaledW = cropImage.width * cropScale;
      const scaledH = cropImage.height * cropScale;
      const dx = cropOffset.x - (scaledW - CROP_SIZE) / 2;
      const dy = cropOffset.y - (scaledH - CROP_SIZE) / 2;
      ctx.drawImage(cropImage, dx, dy, scaledW, scaledH);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("裁剪失败"))), "image/jpeg", 0.9);
      });

      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      await refreshUser();
      closeCropModal();
    } catch (err) {
      setCropUploading(false);
      setProfileError(err instanceof Error ? err.message : "上传失败");
      setCropModalOpen(false);
    }
  };

  const closeCropModal = () => {
    setCropModalOpen(false);
    setCropImage(null);
    setCropImageSrc("");
    setCropUploading(false);
  };

  const handleCropZoomIn = () => setCropScale((s) => Math.min(s + 0.1, MAX_SCALE));
  const handleCropZoomOut = () => setCropScale((s) => Math.max(s - 0.1, MIN_SCALE));

  const handleSaveNickname = async () => {
    const trimmed = nicknameValue.trim();
    if (!trimmed) { setProfileError("昵称不能为空"); return; }
    if (trimmed === user?.nickname) { setEditingNickname(false); return; }
    setProfileError("");
    setNicknameSaving(true);
    try {
      const formData = new FormData();
      formData.append("nickname", trimmed);
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存失败");
      await refreshUser();
      setEditingNickname(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setNicknameSaving(false);
    }
  };

  const handleSendPhoneCode = async () => {
    if (phoneCountdown > 0) return;
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/send-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: user?.phone, purpose: "changePhone" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhoneCodeSent(true);
      setPhoneCountdown(60);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneCode) { setEmailError("请输入短信验证码"); return; }
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/verify-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: user?.phone, code: phoneCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhoneVerifiedToken(data.verifiedToken);
      setEmailStep("enter-new");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendEmailCode = async () => {
    if (emailCountdown > 0) return;
    if (!newEmail) { setEmailError("请输入邮箱地址"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailError("请输入有效的邮箱地址"); return; }
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/send-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, purpose: "bind" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailCodeSent(true);
      setEmailCountdown(60);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailCode) { setEmailError("请输入验证码"); return; }
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, code: emailCode, purpose: "bind" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailVerifiedToken(data.verifiedToken);
      setEmailStep("verify-new");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSubmitBind = async () => {
    if (!emailVerifiedToken) {
      setEmailError("邮箱验证已过期，请重新验证");
      setEmailStep("enter");
      return;
    }
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/bind-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail, verifiedToken: emailVerifiedToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshUser();
      closeEmailModal();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSubmitChange = async () => {
    if (!phoneVerifiedToken) {
      setEmailError("手机验证已过期，请重新验证");
      setEmailStep("verify-phone");
      return;
    }
    if (!emailVerifiedToken) {
      setEmailError("邮箱验证已过期，请重新验证");
      setEmailStep("enter-new");
      return;
    }
    setEmailError("");
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newEmail, phoneVerifiedToken, emailVerifiedToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshUser();
      closeEmailModal();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : String(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendCurrentPhoneCode = async () => {
    if (currentPhoneCountdown > 0 || !user?.phone) return;
    setPhoneError("");
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/send-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: user.phone, purpose: "changePhone" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentPhoneSent(true);
      setCurrentPhoneCountdown(60);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : String(err));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyCurrentPhone = async () => {
    if (!currentPhoneCode || !user?.phone) { setPhoneError("请输入短信验证码"); return; }
    setPhoneError("");
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/verify-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: user.phone, code: currentPhoneCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentPhoneVerifiedToken(data.verifiedToken);
      setPhoneStep("enter-new");
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : String(err));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSendNewPhoneCode = async () => {
    if (newPhoneCountdown > 0) return;
    if (!newPhone || !/^1\d{10}$/.test(newPhone)) { setPhoneError("请输入正确的手机号"); return; }
    setPhoneError("");
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/send-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone, purpose: "changePhone" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewPhoneSent(true);
      setNewPhoneCountdown(60);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : String(err));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyNewPhone = async () => {
    if (!newPhoneCode) { setPhoneError("请输入验证码"); return; }
    setPhoneError("");
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/verify-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone, code: newPhoneCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewPhoneVerifiedToken(data.verifiedToken);
      setPhoneStep("verify-new");
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : String(err));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSubmitPhoneChange = async () => {
    if (!currentPhoneVerifiedToken) {
      setPhoneError("当前手机验证已过期，请重新验证");
      setPhoneStep("verify-current");
      return;
    }
    if (!newPhoneVerifiedToken) {
      setPhoneError("新手机验证已过期，请重新验证");
      setPhoneStep("enter-new");
      return;
    }
    setPhoneError("");
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/change-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPhone, currentPhoneVerifiedToken, newPhoneVerifiedToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshUser();
      closePhoneModal();
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : String(err));
    } finally {
      setPhoneLoading(false);
    }
  };

  if (!user) return null;

  const rn = user.realNameVerification;

  const handleRealNameSubmit = async () => {
    setVerifyError("");
    if (!realName) { setVerifyError("请输入真实姓名"); return; }
    if (!idCardNumber) { setVerifyError("请输入身份证号"); return; }
    if (!isValidIdCardNumber(idCardNumber)) { setVerifyError("身份证号格式不正确"); return; }

    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ realName, idCardNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVerifySuccess(true);
      await refreshUser();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : String(err));
    } finally {
      setVerifying(false);
    }
  };

  const bossVerifyView = getBossVerifyView(rn);
  const shopVerifyView = getShopVerifyView(
    sp as {
      verificationStatus?: string;
      verificationNotes?: string | null;
      licenseImage?: string | null;
    } | null | undefined
  );
  const shopNotesDisplay = formatVerificationNotesForDisplay(
    typeof sp?.verificationNotes === "string" ? sp.verificationNotes : null
  );

  const BossStatusIcon =
    bossVerifyView.badge === "approved"
      ? Check
      : bossVerifyView.badge === "rejected"
        ? XCircle
        : bossVerifyView.badge === "verifying"
          ? Clock
          : null;

  const handleShopVerifySubmit = async () => {
    setShopVerifyError("");
    setShopVerifySubmitting(true);
    try {
      const res = await fetch("/api/verification/shop/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          legalPersonName: typeof sp?.contactName === "string" ? sp.contactName : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "提交失败");
      await refreshUser();
    } catch (err) {
      setShopVerifyError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setShopVerifySubmitting(false);
    }
  };

  const openResubmitModal = () => {
    setResubmitLicenseUrl((sp?.licenseImage as string) || null);
    setResubmitPreview((sp?.licenseImage as string) || null);
    setResubmitError("");
    setResubmitModalOpen(true);
  };

  const handleResubmitLicenseChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResubmitError("");
    setResubmitUploading(true);
    try {
      const formData = new FormData();
      formData.append("license", file);
      const res = await fetch("/api/uploads/license", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      setResubmitLicenseUrl(data.url);
      setResubmitPreview(data.url);
    } catch (err) {
      setResubmitError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setResubmitUploading(false);
      e.target.value = "";
    }
  };

  const handleResubmitConfirm = async () => {
    if (!resubmitLicenseUrl) {
      setResubmitError("请上传营业执照");
      return;
    }
    setResubmitError("");
    setResubmitSubmitting(true);
    try {
      const res = await fetch("/api/verification/shop/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          licenseImageUrl: resubmitLicenseUrl,
          legalPersonName: typeof sp?.contactName === "string" ? sp.contactName : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "提交失败");
      await refreshUser();
      setResubmitModalOpen(false);
    } catch (err) {
      setResubmitError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setResubmitSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]">
      <div className="max-w-md mx-auto px-4 py-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">返回</span>
        </button>

        <div className="glass rounded-3xl p-6 sm:p-8 glow-card">
          {profileError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {profileError}
            </div>
          )}
          {/* Header */}
          <div className="text-center mb-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center overflow-hidden relative group cursor-pointer"
            >
              {user.avatar ? (
                <img src={user.avatar} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-gray-600" />
              )}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
            {editingNickname ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={nicknameValue}
                  onChange={(e) => setNicknameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveNickname(); if (e.key === "Escape") { setEditingNickname(false); setNicknameValue(user?.nickname || ""); } }}
                  onBlur={handleSaveNickname}
                  maxLength={20}
                  className="bg-white/5 border border-pink-500/50 rounded-xl px-3 py-1 text-white text-center outline-none focus:border-pink-400 w-40 text-xl font-bold"
                  autoFocus
                />
                {nicknameSaving && <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-bold text-white">{user.nickname}</h1>
                <button
                  type="button"
                  onClick={() => { setEditingNickname(true); setNicknameValue(user.nickname || ""); }}
                  className="text-gray-500 hover:text-gray-300 transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                user.role === "BOSS"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-violet-500/10 text-violet-400"
              )}>
                {user.role === "BOSS" ? <Crown className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                {user.role === "BOSS" ? "老板" : "店铺"}
              </span>

              {user.role === "BOSS" && bossVerifyView.badge !== "none" && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                    getVerifyBadgeClass(bossVerifyView.badge)
                  )}
                >
                  {BossStatusIcon && <BossStatusIcon className="w-3 h-3" />}
                  {bossVerifyView.label}
                </span>
              )}
              {user.role === "SHOP" && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                    getVerifyBadgeClass(shopVerifyView.badge)
                  )}
                >
                  {shopVerifyView.label}
                </span>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="mb-6 p-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 mb-1">账号信息</h2>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">手机号</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-200">
                    {user.phone ? maskPhone(user.phone) : "未绑定"}
                  </p>
                  <button
                    onClick={() => {
                      setPhoneStep("verify-current");
                      setCurrentPhoneCode("");
                      setCurrentPhoneSent(false);
                      setCurrentPhoneCountdown(0);
                      setCurrentPhoneVerifiedToken("");
                      setNewPhone("");
                      setNewPhoneCode("");
                      setNewPhoneSent(false);
                      setNewPhoneCountdown(0);
                      setNewPhoneVerifiedToken("");
                      setPhoneError("");
                      setPhoneModalOpen(true);
                    }}
                    className="text-xs text-pink-400 hover:text-pink-300 shrink-0"
                  >
                    更换
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">邮箱</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-200 truncate">
                    {user.email ? maskEmail(user.email) : "未绑定"}
                  </p>
                  <button
                    onClick={() => {
                      setEmailStep(isBinding ? "enter" : "enter");
                      setEmailModalOpen(true);
                    }}
                    className="text-xs text-pink-400 hover:text-pink-300 shrink-0"
                  >
                    {isBinding ? "绑定邮箱" : "更换"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-gray-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">登录密码</p>
                <p className="text-sm text-gray-200">
                  {user.hasPassword ? (
                    <button
                      onClick={() => router.push("/change-password")}
                      className="text-pink-400 hover:text-pink-300 transition"
                    >
                      修改密码 →
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/change-password")}
                      className="text-pink-400 hover:text-pink-300 transition"
                    >
                      设置密码 →
                    </button>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Real Name Verification (BOSS only) */}
          {user.role === "BOSS" && (
            <div className="mb-6 p-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-pink-400" />
                <h2 className="text-sm font-semibold text-gray-300">实名认证</h2>
              </div>

              {rn && (
                <div className={cn(
                  "p-3 rounded-xl text-sm mb-3",
                  rn.status === "APPROVED" ? "bg-green-500/10 border border-green-500/20" :
                  rn.status === "REJECTED" ? "bg-red-500/10 border border-red-500/20" :
                  "bg-amber-500/10 border border-amber-500/20"
                )}>
                  <p className={cn(
                    "text-xs",
                    rn.status === "APPROVED" ? "text-green-400" :
                    rn.status === "REJECTED" ? "text-red-400" :
                    "text-amber-400"
                  )}>
                    {rn.status === "APPROVED" && "✅ 实名认证已通过"}
                    {rn.status === "REJECTED" && "❌ 实名认证未通过，请重新提交"}
                    {rn.status === "PENDING" && "⏳ 实名信息核验中，请稍后刷新"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">姓名：{rn.realName}</p>
                </div>
              )}

              {bossVerifyView.canSubmit && (
                <>
                  {!showRealName ? (
                    <button
                      onClick={() => setShowRealName(true)}
                      className="w-full py-2.5 rounded-xl border border-dashed border-white/15 text-gray-400 text-sm hover:border-pink-400/40 hover:text-pink-400 transition"
                    >
                      {rn ? "重新提交实名认证" : "立即实名认证"}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">真实姓名</label>
                        <input
                          type="text"
                          value={realName}
                          onChange={(e) => setRealName(e.target.value)}
                          placeholder="请输入真实姓名"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">身份证号</label>
                        <input
                          type="text"
                          value={idCardNumber}
                          onChange={(e) => setIdCardNumber(e.target.value)}
                          placeholder="请输入身份证号"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition text-sm"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">身份证号经 AES-256 加密后存储，仅用于身份核验</p>
                      </div>

                      {verifyError && (
                        <p className="text-xs text-red-400">{verifyError}</p>
                      )}
                      {verifySuccess && (
                        <p className="text-xs text-green-400">提交成功，请等待审核</p>
                      )}

                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        您的姓名和身份证号将用于实名认证，信息经加密传输和存储，仅用于身份核验。
                        详见
                        <Link href="/privacy" className="text-pink-500/60 hover:text-pink-400 mx-0.5 underline">隐私政策</Link>
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={handleRealNameSubmit}
                          disabled={verifying}
                          className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                        >
                          {verifying ? "提交中..." : "提交认证"}
                        </button>
                        <button
                          onClick={() => setShowRealName(false)}
                          className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Shop Basic Info (SHOP only) */}
          {user.role === "SHOP" && (
            <div className="mb-6 p-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Store className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-semibold text-gray-300">店铺信息</h2>
                {shopInfoSaving && <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />}
              </div>
              <div className="space-y-3">
                {/* Shop Name */}
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">店铺名称</p>
                    {editingShopField === "shopName" ? (
                      <input
                        type="text"
                        value={shopNameValue}
                        onChange={(e) => setShopNameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveShopField("shopName", shopNameValue.trim()); if (e.key === "Escape") { setEditingShopField(null); setShopNameValue((sp?.shopName as string) || ""); } }}
                        onBlur={() => saveShopField("shopName", shopNameValue.trim())}
                        maxLength={30}
                        className="bg-white/5 border border-violet-500/50 rounded-lg px-2 py-1 text-sm text-white outline-none w-full mt-0.5"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-200">{sp?.shopName ? (sp.shopName as string) : "未设置"}</p>
                        <button onClick={() => { setShopNameValue((sp?.shopName as string) || ""); setEditingShopField("shopName"); }} className="text-gray-500 hover:text-gray-300">
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-gray-500 shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">店铺简介</p>
                    {editingShopField === "shopDesc" ? (
                      <textarea
                        value={shopDescValue}
                        onChange={(e) => setShopDescValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Escape") { setEditingShopField(null); setShopDescValue((sp?.shopDesc as string) || ""); } }}
                        onBlur={() => saveShopField("shopDesc", shopDescValue.trim())}
                        maxLength={200}
                        rows={2}
                        className="bg-white/5 border border-violet-500/50 rounded-lg px-2 py-1 text-sm text-white outline-none w-full mt-0.5 resize-none"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-200 truncate">{sp?.shopDesc ? (sp.shopDesc as string) : "未设置"}</p>
                        <button onClick={() => { setShopDescValue((sp?.shopDesc as string) || ""); setEditingShopField("shopDesc"); }} className="text-gray-500 hover:text-gray-300 shrink-0">
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">经营地址</p>
                    {editingShopField === "shopAddress" ? (
                      <input
                        type="text"
                        value={shopAddressValue}
                        onChange={(e) => setShopAddressValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveShopField("shopAddress", shopAddressValue.trim()); if (e.key === "Escape") { setEditingShopField(null); setShopAddressValue((sp?.shopAddress as string) || ""); } }}
                        onBlur={() => saveShopField("shopAddress", shopAddressValue.trim())}
                        maxLength={100}
                        className="bg-white/5 border border-violet-500/50 rounded-lg px-2 py-1 text-sm text-white outline-none w-full mt-0.5"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-200 truncate">{sp?.shopAddress ? (sp.shopAddress as string) : "未设置"}</p>
                        <button onClick={() => { setShopAddressValue((sp?.shopAddress as string) || ""); setEditingShopField("shopAddress"); }} className="text-gray-500 hover:text-gray-300 shrink-0">
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Name */}
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">负责人</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-200">{sp?.contactName ? (sp.contactName as string) : "未设置"}</p>
                      <button
                        onClick={openContactNameModal}
                        className="text-xs text-violet-400 hover:text-violet-300 shrink-0"
                      >
                        更换
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contact Phone */}
                <div className="flex items-center gap-3">
                  <PhoneCall className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">联系电话</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-200">{sp?.contactPhone ? maskPhone(sp.contactPhone as string) : "未设置"}</p>
                      <button
                        onClick={openContactPhoneModal}
                        className="text-xs text-violet-400 hover:text-violet-300 shrink-0"
                      >
                        更换
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shop Certification Status (SHOP only) */}
          {user.role === "SHOP" && (
            <div className="mb-6 p-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <BadgeCheck className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-semibold text-gray-300">店铺认证</h2>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                    getVerifyBadgeClass(shopVerifyView.badge)
                  )}
                >
                  {shopVerifyView.label}
                </span>
              </div>

              {sp ? (
                <div className="space-y-3">
                  <div
                    className={cn("p-3 rounded-xl border", getVerifyPanelClass(shopVerifyView.badge))}
                  >
                    <p className={cn("text-xs font-medium", getVerifyTextClass(shopVerifyView.badge))}>
                      {shopVerifyView.message}
                    </p>
                    {typeof sp.verifiedAt === "string" &&
                      sp.verifiedAt &&
                      shopVerifyView.badge === "approved" && (
                        <p className="text-[10px] text-gray-500 mt-1">
                          认证通过时间：{new Date(sp.verifiedAt as string).toLocaleString("zh-CN")}
                        </p>
                      )}
                  </div>

                  {shopVerifyError && <p className="text-xs text-red-400">{shopVerifyError}</p>}

                  {/* 认证详情 */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                    <p className="text-[10px] text-gray-500 font-medium">认证详情</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">核验方式：</span>
                        <span className="text-gray-300">阿里云企业要素核验</span>
                      </div>
                      <div>
                        <span className="text-gray-500">核验类型：</span>
                        <span className="text-gray-300">{formatLicenseType(sp.licenseType)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">企业名称：</span>
                        <span className="text-gray-300">{typeof sp.shopName === "string" ? sp.shopName : "—"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">负责人：</span>
                        <span className="text-gray-300">
                          {typeof sp.contactName === "string" ? sp.contactName : "—"}
                          {typeof sp.contactIdCard === "string" && sp.contactIdCard ? (
                            <span className="text-gray-500"> · 身份证已提交</span>
                          ) : null}
                        </span>
                      </div>
                    </div>

                    {shopNotesDisplay && (
                      <div className="pt-2 border-t border-white/[0.04]">
                        <p className="text-[10px] text-gray-500">备注</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{shopNotesDisplay}</p>
                      </div>
                    )}
                  </div>

                  {/* 营业执照预览 */}
                  {typeof sp.licenseImage === "string" && sp.licenseImage && (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof sp.licenseImage === "string" && sp.licenseImage) {
                          window.open(sp.licenseImage, "_blank");
                        }
                      }}
                      className="w-full rounded-xl overflow-hidden border border-white/[0.06] hover:border-violet-500/30 transition group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sp.licenseImage as string}
                        alt="营业执照"
                        className="w-full h-28 object-contain bg-black/30 group-hover:opacity-90 transition-opacity"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                      <p className="text-[10px] text-gray-400 py-1.5 group-hover:text-violet-400 transition">
                        点击查看营业执照原图
                      </p>
                    </button>
                  )}

                  {shopVerifyView.canSubmit && (
                    <button
                      type="button"
                      onClick={handleShopVerifySubmit}
                      disabled={shopVerifySubmitting}
                      className="w-full py-2.5 rounded-xl border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-500/10 transition disabled:opacity-40"
                    >
                      {shopVerifySubmitting ? "提交中…" : "开始核验"}
                    </button>
                  )}

                  {shopVerifyView.canResubmit && !shopVerifyView.canSubmit && (
                    <button
                      type="button"
                      onClick={openResubmitModal}
                      className="w-full py-2.5 rounded-xl border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-500/10 transition"
                    >
                      上传营业执照并核验
                    </button>
                  )}

                  {shopVerifyView.canResubmit && shopVerifyView.canSubmit && (
                    <button
                      type="button"
                      onClick={openResubmitModal}
                      className="w-full py-2.5 rounded-xl border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-500/10 transition"
                    >
                      重新提交认证资料
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-gray-500/5 border border-white/[0.06]">
                  <p className="text-xs text-gray-500">尚未提交店铺认证资料</p>
                </div>
              )}
            </div>
          )}

          {/* Logout */}
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/10 transition"
          >
            退出登录
          </button>

          <Link
            href="/delete-account"
            className="block text-center mt-3 text-xs text-gray-600 hover:text-red-400 transition-colors"
          >
            注销账号
          </Link>
        </div>
      </div>

      {cropModalOpen && cropImageSrc && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 select-none">
          <div className="flex items-center justify-between w-full max-w-md px-6 py-4">
            <h3 className="text-white font-semibold text-lg">裁剪头像</h3>
            <button onClick={closeCropModal} className="text-gray-400 hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div
            ref={cropContainerRef}
            className="relative overflow-hidden rounded-full touch-none"
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
            onMouseDown={handleCropMouseDown}
            onMouseMove={handleCropMouseMove}
            onMouseUp={handleCropMouseUp}
            onMouseLeave={handleCropMouseUp}
            onTouchStart={handleCropTouchStart}
            onTouchMove={handleCropTouchMove}
            onTouchEnd={handleCropMouseUp}
            onWheel={handleCropWheel}
          >
            <div
              className="absolute cursor-grab active:cursor-grabbing"
              style={{
                width: cropImage ? cropImage.width * cropScale : 0,
                height: cropImage ? cropImage.height * cropScale : 0,
                left: cropOffset.x - ((cropImage ? cropImage.width * cropScale : 0) - CROP_SIZE) / 2,
                top: cropOffset.y - ((cropImage ? cropImage.height * cropScale : 0) - CROP_SIZE) / 2,
              }}
            >
              <img src={cropImageSrc} alt="" className="w-full h-full pointer-events-none" draggable={false} />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none" />
          </div>

          <p className="text-gray-400 text-xs mt-4 mb-2">拖拽图片调整位置</p>

          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={handleCropZoomOut}
              disabled={cropScale <= MIN_SCALE}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-30"
            >
              <ZoomOut className="w-5 h-5 text-white" />
            </button>
            <input
              type="range"
              min={MIN_SCALE * 10}
              max={MAX_SCALE * 10}
              step={1}
              value={Math.round(cropScale * 10)}
              onChange={(e) => setCropScale(Number(e.target.value) / 10)}
              className="w-32 accent-pink-500"
            />
            <button
              type="button"
              onClick={handleCropZoomIn}
              disabled={cropScale >= MAX_SCALE}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-30"
            >
              <ZoomIn className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeCropModal}
              disabled={cropUploading}
              className="px-8 py-2.5 rounded-xl border border-white/20 text-gray-300 text-sm font-medium hover:border-white/30 transition disabled:opacity-40"
            >
              取消
            </button>
            <button
              type="button"
              onClick={applyCropAndUpload}
              disabled={cropUploading}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2"
            >
              {cropUploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 上传中...</>
              ) : (
                "确认"
              )}
            </button>
          </div>
        </div>
      )}

      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#12122a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">
                {isBinding ? "绑定邮箱" : "更换邮箱"}
              </h3>
              <button onClick={closeEmailModal} className="text-gray-400 hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isBinding ? (
              <div className="space-y-4">
                {emailStep === "enter" && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">新邮箱地址</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="请输入要绑定的邮箱"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                      />
                    </div>
                    {emailCodeSent && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">验证码</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={emailCode}
                            onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="6位验证码"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {!emailCodeSent ? (
                        <button
                          onClick={handleSendEmailCode}
                          disabled={emailLoading || !newEmail}
                          className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                        >
                          {emailLoading ? "发送中..." : emailCountdown > 0 ? `${emailCountdown}秒后重发` : "发送验证码"}
                        </button>
                      ) : (
                        <button
                          onClick={handleVerifyEmail}
                          disabled={emailLoading || emailCode.length < 6}
                          className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                        >
                          {emailLoading ? "验证中..." : "验证邮箱"}
                        </button>
                      )}
                    </div>
                  </>
                )}

                {emailStep === "verify-new" && (
                  <>
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-400">✓ 邮箱 {newEmail} 验证通过</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEmailStep("enter");
                          setEmailCode("");
                          setEmailCodeSent(false);
                          setEmailCountdown(0);
                          setEmailVerifiedToken("");
                          setEmailError("");
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                      >
                        返回修改
                      </button>
                      <button
                        onClick={handleSubmitBind}
                        disabled={emailLoading}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                      >
                        {emailLoading ? "绑定中..." : "确认绑定"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {emailStep === "enter" && (
                  <>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <p className="text-xs text-gray-400">当前邮箱</p>
                      <p className="text-sm text-gray-200 mt-0.5">{user?.email ? maskEmail(user.email) : "未绑定"}</p>
                    </div>
                    <button
                      onClick={() => setEmailStep("verify-phone")}
                      className="w-full py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition"
                    >
                      开始更换
                    </button>
                  </>
                )}

                {emailStep === "verify-phone" && (
                  <>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <p className="text-xs text-gray-400">手机号</p>
                      <p className="text-sm text-gray-200 mt-0.5">{user?.phone ? maskPhone(user.phone) : ""}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">短信验证码</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="请输入短信验证码"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSendPhoneCode}
                        disabled={emailLoading || phoneCountdown > 0}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition disabled:opacity-40"
                      >
                        {phoneCodeSent ? (phoneCountdown > 0 ? `${phoneCountdown}秒后重发` : "重新发送") : "发送验证码"}
                      </button>
                      <button
                        onClick={handleVerifyPhone}
                        disabled={emailLoading || phoneCode.length < 6}
                        className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                      >
                        {emailLoading ? "验证中..." : "验证手机"}
                      </button>
                    </div>
                    <button
                      onClick={() => setEmailStep("enter")}
                      className="w-full py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                    >
                      返回
                    </button>
                  </>
                )}

                {emailStep === "enter-new" && (
                  <>
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-400">✓ 手机验证通过</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">新邮箱地址</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="请输入新邮箱"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                      />
                    </div>
                    {emailCodeSent && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">新邮箱验证码</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="6位验证码"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      {!emailCodeSent ? (
                        <button
                          onClick={handleSendEmailCode}
                          disabled={emailLoading || !newEmail}
                          className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                        >
                          {emailLoading ? "发送中..." : emailCountdown > 0 ? `${emailCountdown}秒后重发` : "发送验证码"}
                        </button>
                      ) : (
                        <button
                          onClick={handleVerifyEmail}
                          disabled={emailLoading || emailCode.length < 6}
                          className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                        >
                          {emailLoading ? "验证中..." : "验证邮箱"}
                        </button>
                      )}
                    </div>
                  </>
                )}

                {emailStep === "verify-new" && (
                  <>
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-400">✓ 手机验证通过</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-400">✓ 新邮箱 {newEmail} 验证通过</p>
                    </div>
                    <button
                      onClick={handleSubmitChange}
                      disabled={emailLoading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                    >
                      {emailLoading ? "更换中..." : "确认更换"}
                    </button>
                  </>
                )}
              </div>
            )}

            {emailError && (
              <p className="mt-3 text-xs text-red-400">{emailError}</p>
            )}
          </div>
        </div>
      )}
      {phoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#12122a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">更换手机号</h3>
              <button onClick={closePhoneModal} className="text-gray-400 hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {phoneStep === "verify-current" && (
                <>
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <p className="text-xs text-amber-400">⚠️ 更换手机号后，下次登录请使用新号码</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <p className="text-xs text-gray-400">当前手机号</p>
                    <p className="text-sm text-gray-200 mt-0.5">{user?.phone ? maskPhone(user.phone) : ""}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">短信验证码</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={currentPhoneCode}
                      onChange={(e) => setCurrentPhoneCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="请输入短信验证码"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">向当前手机号发送验证码，验证身份</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSendCurrentPhoneCode}
                      disabled={phoneLoading || currentPhoneCountdown > 0}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition disabled:opacity-40"
                    >
                      {currentPhoneSent ? (currentPhoneCountdown > 0 ? `${currentPhoneCountdown}秒后重发` : "重新发送") : "发送验证码"}
                    </button>
                    <button
                      onClick={handleVerifyCurrentPhone}
                      disabled={phoneLoading || currentPhoneCode.length < 6}
                      className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                    >
                      {phoneLoading ? "验证中..." : "验证手机"}
                    </button>
                  </div>
                  <button
                    onClick={closePhoneModal}
                    className="w-full py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                  >
                    取消
                  </button>
                </>
              )}

              {phoneStep === "enter-new" && (
                <>
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-green-400">✓ 当前手机验证通过</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">新手机号</label>
                    <input
                      type="tel"
                      maxLength={11}
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="请输入新手机号"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                    />
                  </div>
                  {newPhoneSent && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">新手机验证码</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={newPhoneCode}
                        onChange={(e) => setNewPhoneCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="请输入短信验证码"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition text-sm"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    {!newPhoneSent ? (
                      <button
                        onClick={handleSendNewPhoneCode}
                        disabled={phoneLoading || newPhone.length < 11}
                        className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                      >
                        {phoneLoading ? "发送中..." : newPhoneCountdown > 0 ? `${newPhoneCountdown}秒后重发` : "发送验证码"}
                      </button>
                    ) : (
                      <button
                        onClick={handleVerifyNewPhone}
                        disabled={phoneLoading || newPhoneCode.length < 6}
                        className="flex-1 py-2.5 rounded-xl border border-pink-500/30 text-pink-400 text-sm font-medium hover:bg-pink-500/10 transition disabled:opacity-40"
                      >
                        {phoneLoading ? "验证中..." : "验证新手机"}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setPhoneStep("verify-current");
                      setNewPhone("");
                      setNewPhoneCode("");
                      setNewPhoneSent(false);
                      setNewPhoneCountdown(0);
                      setNewPhoneVerifiedToken("");
                    }}
                    className="w-full py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                  >
                    返回上一步
                  </button>
                </>
              )}

              {phoneStep === "verify-new" && (
                <>
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-green-400">✓ 当前手机验证通过</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-green-400">✓ 新手机号 {newPhone} 验证通过</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPhoneStep("enter-new");
                        setNewPhoneCode("");
                        setNewPhoneSent(false);
                        setNewPhoneCountdown(0);
                        setNewPhoneVerifiedToken("");
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                    >
                      返回修改
                    </button>
                    <button
                      onClick={handleSubmitPhoneChange}
                      disabled={phoneLoading}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                    >
                      {phoneLoading ? "更换中..." : "确认更换"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {phoneError && (
              <p className="mt-3 text-xs text-red-400">{phoneError}</p>
            )}
          </div>
        </div>
      )}
      {contactNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#12122a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">更换负责人</h3>
              <button onClick={() => setContactNameModalOpen(false)} className="text-gray-400 hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {contactNameDone ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-green-400">✅ 负责人已更新为 {contactNamePicked}</p>
                </div>
                <button
                  onClick={() => setContactNameModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition"
                >
                  完成
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <p className="text-xs text-amber-400">⚠️ 更换负责人需要进行本人实名认证</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">新负责人姓名</label>
                  <input
                    type="text"
                    value={contactNamePicked}
                    onChange={(e) => setContactNamePicked(e.target.value)}
                    placeholder="请输入新负责人姓名"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-violet-500/50 transition text-sm"
                  />
                </div>
                <div className="border-t border-white/[0.06] pt-4">
                  <p className="text-xs text-gray-500 mb-3">请填写您的真实身份信息进行核验</p>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">您的真实姓名</label>
                    <input
                      type="text"
                      value={contactNameRealName}
                      onChange={(e) => setContactNameRealName(e.target.value)}
                      placeholder="请输入真实姓名"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-violet-500/50 transition text-sm"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-gray-400 mb-1">您的身份证号</label>
                    <input
                      type="text"
                      value={contactNameIdCard}
                      onChange={(e) => setContactNameIdCard(e.target.value)}
                      placeholder="请输入身份证号"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-violet-500/50 transition text-sm"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">身份证号经 AES-256 加密后存储，仅用于身份核验</p>
                  </div>
                </div>

                {contactNameError && (
                  <p className="text-xs text-red-400">{contactNameError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setContactNameModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitContactName}
                    disabled={contactNameVerifying}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                  >
                    {contactNameVerifying ? "提交中..." : "提交核验并保存"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {contactPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#12122a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">更换联系电话</h3>
              <button onClick={() => setContactPhoneModalOpen(false)} className="text-gray-400 hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <p className="text-xs text-amber-400">⚠️ 更换联系电话将影响店铺的联系方式，需短信验证</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">新的联系电话</label>
                <input
                  type="tel"
                  maxLength={11}
                  value={contactPhonePicked}
                  onChange={(e) => setContactPhonePicked(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="请输入新的联系电话"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-violet-500/50 transition text-sm"
                />
              </div>

              {contactPhoneSent && !contactPhoneVerifiedToken && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">短信验证码</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={contactPhoneCode}
                    onChange={(e) => setContactPhoneCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="6位验证码"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-violet-500/50 transition text-sm"
                  />
                </div>
              )}

              {contactPhoneVerifiedToken && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-green-400">✓ 手机号 {contactPhonePicked} 验证通过</p>
                </div>
              )}

              {contactPhoneError && (
                <p className="text-xs text-red-400">{contactPhoneError}</p>
              )}

              {!contactPhoneVerifiedToken ? (
                <div className="flex gap-2">
                  {!contactPhoneSent ? (
                    <button
                      onClick={handleSendContactPhoneCode}
                      disabled={contactPhoneLoading || contactPhonePicked.length < 11}
                      className="flex-1 py-2.5 rounded-xl border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-500/10 transition disabled:opacity-40"
                    >
                      {contactPhoneLoading ? "发送中..." : contactPhoneCountdown > 0 ? `${contactPhoneCountdown}秒后重发` : "发送验证码"}
                    </button>
                  ) : (
                    <button
                      onClick={handleVerifyContactPhone}
                      disabled={contactPhoneLoading || contactPhoneCode.length < 6}
                      className="flex-1 py-2.5 rounded-xl border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-500/10 transition disabled:opacity-40"
                    >
                      {contactPhoneLoading ? "验证中..." : "验证手机"}
                    </button>
                  )}
                  <button
                    onClick={() => setContactPhoneModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setContactPhoneCode("");
                      setContactPhoneSent(false);
                      setContactPhoneCountdown(0);
                      setContactPhoneVerifiedToken("");
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                  >
                    重新验证
                  </button>
                  <button
                    onClick={handleSubmitContactPhone}
                    disabled={contactPhoneLoading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                  >
                    {contactPhoneLoading ? "保存中..." : "确认更换"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {resubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#12122a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">重新提交认证资料</h3>
              <button
                type="button"
                onClick={() => setResubmitModalOpen(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                请上传最新营业执照。负责人须与执照法定代表人一致（当前：
                {typeof sp?.contactName === "string" ? sp.contactName : "—"}）。
              </p>
              <input
                ref={resubmitLicenseInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleResubmitLicenseChange}
              />
              <button
                type="button"
                disabled={resubmitUploading}
                onClick={() => resubmitLicenseInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/10 rounded-xl p-4 text-sm text-gray-400 hover:border-violet-500/40 transition disabled:opacity-50"
              >
                {resubmitUploading
                  ? "上传中…"
                  : resubmitPreview
                    ? "点击更换营业执照"
                    : "上传营业执照"}
              </button>
              {resubmitPreview && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={resubmitPreview}
                  alt="执照预览"
                  className="w-full h-28 object-contain rounded-lg bg-black/30"
                />
              )}
              {resubmitError && <p className="text-xs text-red-400">{resubmitError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResubmitModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 transition"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleResubmitConfirm}
                  disabled={resubmitSubmitting || !resubmitLicenseUrl}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                >
                  {resubmitSubmitting ? "提交中…" : "提交核验"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 中国大陆二代居民身份证号（18 位） */
const ID_CARD_REGEX =
  /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

export function isValidIdCardNumber(idCardNumber: string): boolean {
  return ID_CARD_REGEX.test(idCardNumber.trim());
}

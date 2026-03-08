/**
 * 전화번호를 010-0000-0000 형식으로 변환합니다.
 * @param phone 숫자로 된 전화번호 문자열 (예: 01012345678)
 * @returns 포맷팅된 전화번호 문자열 (예: 010-1234-5678)
 */
export function formatPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (cleanPhone.length === 11) {
        return cleanPhone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (cleanPhone.length === 10) {
        if (cleanPhone.startsWith('02')) {
            return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
        } else {
            return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        }
    } else if (cleanPhone.length === 9 && cleanPhone.startsWith('02')) {
        return cleanPhone.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    }

    return phone;
}

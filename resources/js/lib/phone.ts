/**
 * Group an E.164 number for reading. Madagascar and France get their usual grouping; any other country is shown
 * as stored.
 */
export function formatPhone(phone: string): string {
    const madagascar = phone.match(/^\+261(\d{2})(\d{2})(\d{3})(\d{2})$/);

    if (madagascar) {
        return `+261 ${madagascar.slice(1).join(' ')}`;
    }

    const france = phone.match(/^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/);

    if (france) {
        return `+33 ${france.slice(1).join(' ')}`;
    }

    return phone;
}

export class Cookies {

    /**
     * Récupère la valeur d'un cookie par son nom.
     * @param {string} name - Le nom du cookie.
     * @returns {string|null} La valeur du cookie, ou null si introuvable.
     */
    get_cookie(name) {
        const encoded = encodeURIComponent(name);
        const cookies = document.cookie.split("; ");

        for (const cookie of cookies) {
            const [key, value] = cookie.split("=");
            if (key === encoded) {
                return decodeURIComponent(value);
            }
        }

        return null;
    }

    /**
     * Crée ou met à jour un cookie.
     * @param {string} name  - Le nom du cookie.
     * @param {number} time  - La durée de vie en jours.
     * @param {string} value - La valeur du cookie.
     */
    set_cookie(name, time, value) {
        const expires = new Date(Date.now() + time * 24 * 60 * 60 * 1000).toUTCString();

        document.cookie = [
            `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
            `expires=${expires}`,
            "path=/",
            "SameSite=Lax",
        ].join("; ");
    }

    /**
     * Met à jour un cookie existant (valeur et/ou durée).
     * Lève une erreur si le cookie n'existe pas.
     * @param {string}      name     - Le nom du cookie à mettre à jour.
     * @param {string|null} [value]  - La nouvelle valeur (null pour la conserver).
     * @param {number|null} [time]   - La nouvelle durée en jours (null pour la conserver).
     */
    update_cookie(name, value = null, time = null) {
        const current = this.get_cookie(name);

        if (current === null) {
            throw new Error(`Cookie "${name}" introuvable, impossible de le mettre à jour.`);
        }

        const newValue = value !== null ? value : current;
        const newTime  = time  !== null ? time  : 1;

        this.set_cookie(name, newTime, newValue);
    }

    /**
     * Supprime un cookie en le faisant expirer immédiatement.
     * @param {string} name - Le nom du cookie à supprimer.
     */
    delete_cookie(name) {
        document.cookie = [
            `${encodeURIComponent(name)}=`,
            "expires=Thu, 01 Jan 1970 00:00:00 UTC",
            "path=/",
        ].join("; ");
    }
}
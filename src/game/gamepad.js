export class GamepadManager {
    // Seuil du joystick analogique (évite les dérives à 0)
    static #DEAD_ZONE = 0.4;
    // Intervalle de polling en ms (la Gamepad API n'émet pas d'événements fiables)
    static #POLL_INTERVAL = 50;

    #game;
    #polling_id   = null;
    #prev_buttons = [];   // état boutons au tick précédent (évite la répétition)

    constructor(game) {
        this.#game = game;
        this.#start_polling();
    }

    // ─── Polling ─────────────────────────────────────────────────────────────────────────────────────────────────────

    #start_polling() {
        this.#polling_id = setInterval(() => this.#poll(), GamepadManager.#POLL_INTERVAL);
    }

    #poll() {
        // navigator.getGamepads() retourne l'état instantané (pas de cache)
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

        for (const gp of gamepads) {
            if (!gp) continue;
            this.#handle_gamepad(gp);
            break; // On ne gère que la première manette connectée
        }
    }

    // ─── Traitement d'une frame manette ──────────────────────────────────────────────────────────────────────────────

    #handle_gamepad(gp) {
        const btns    = gp.buttons;
        const axes    = gp.axes;
        const prev    = this.#prev_buttons;

        // --- Déplacements ---

        // Joystick gauche : axes[0] (horizontal), axes[1] (vertical)
        const lx = axes[0] ?? 0;
        const ly = axes[1] ?? 0;

        if (Math.abs(lx) > Math.abs(ly)) {
            // Axe horizontal dominant
            if (lx >= GamepadManager.#DEAD_ZONE)       this.#game.key_press_right();
            else if (lx <= -GamepadManager.#DEAD_ZONE) this.#game.key_press_left();
        } else {
            // Axe vertical dominant
            if (ly >= GamepadManager.#DEAD_ZONE)       this.#game.key_press_down();
            else if (ly <= -GamepadManager.#DEAD_ZONE) this.#game.key_press_up();
        }

        // D-pad (boutons standard : 12=haut, 13=bas, 14=gauche, 15=droite)
        if (this.#pressed(btns, 12)) this.#game.key_press_up();
        if (this.#pressed(btns, 13)) this.#game.key_press_down();
        if (this.#pressed(btns, 14)) this.#game.key_press_left();
        if (this.#pressed(btns, 15)) this.#game.key_press_right();

        // --- Boutons d'action (front-edge uniquement : évite la répétition) ---

        // A / Croix (0), B / Rond (1), X / Carré (2), Y / Triangle (3)
        // → Entrée / Click : même comportement qu'Enter + click (kill_z ou reset)
        for (const idx of [0, 1, 2, 3]) {
            if (this.#just_pressed(btns, prev, idx)) {
                this.#game.key_press_enter();
                // kill_z() est déjà appelé dans key_press_enter() si #freeze est actif,
                // mais on l'appelle aussi directement pour couvrir le click générique.
                if (typeof this.#game.kill_z === 'function') {
                    this.#game.kill_z();
                }
            }
        }
        // Start (9) -> Pause
        if (this.#just_pressed(btns, prev, 9)) this.#game.key_press_esc();

        // Menu / Select (8) → Couper/activer la musique
        if (this.#just_pressed(btns, prev, 8)) this.#game.key_press_space();

        // --- Sauvegarde de l’état courant --- //
        this.#prev_buttons = btns.map(b => b.pressed);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────
    /** vrai si le bouton est actuellement enfoncé. **/
    #pressed(btns, idx) {
        return btns[idx]?.pressed ?? false;
    }
    /** Vrai uniquement au premier tick où le bouton passe de relâché à enfoncé. */
    #just_pressed(btns, prev, idx) {
        const now  = btns[idx]?.pressed ?? false;
        const was  = prev[idx] ?? false;
        return now && !was;
    }
    // ─── Nettoyage ───────────────────────────────────────────────────────────────────────────────────────────────────
    /** Arrête le polling. À appeler si l’instance de Game est détruite. */
    destroy() {
        if (this.#polling_id !== null) {
            clearInterval(this.#polling_id);
            this.#polling_id = null;
        }
    }
}
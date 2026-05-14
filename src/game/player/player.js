import {Chaine} from "./chaine.js";

export class Player {
    #horde;
    #nb_zombies;
    #score;
    #vie;
    #liste_img_z;
    #liste_membre;

    constructor(x, y){
        this.#horde = new Chaine("zam", x, y);
        this.#nb_zombies = 0;
        this.#liste_membre = [];
        this.#score = 0;
        this.#vie = 0;
        this.initialiser_z_liste();
    }

    gagner_vie() { this.#vie += 1; }
    perdre_vie() { this.#vie -= 1; }
    get_vie() {return this.#vie}
    est_mort() { return this.#vie < 0 }
    #ajouter_chaine(classe){
        const last_z = this.#horde.get_queue().get_position();
        let x = last_z[0];
        let y = last_z[1];
        let zombie = new Chaine(classe, x, y);
        this.#horde.append(zombie);
        this.#nb_zombies = this.#nb_zombies + 1;
    }
    ajouter_un_zombie() {
        let rand = Math.floor(Math.random() * this.#liste_img_z.length);
        this.#ajouter_chaine(this.#liste_img_z[rand])
    }
    ajouter_un_membre(classe){
        this.#ajouter_chaine(classe);
        this.#liste_membre.push(classe);
    }
    ajouter_retro(){
        this.#ajouter_chaine("retro_z");
    }
    retirer_trois_zombie() {
        let membre = []
        for (let i = 0; i < 3; i++) {
            let z = this.get_horde().pop();
            this.#nb_zombies -= 1;
            if (!z.substring(0,4) === "zomb" && !z.substring(0,5) === "retro") {
                var index = this.#liste_membre.indexOf(z);
                membre.push(z);
                if (index !== -1) {
                    this.#liste_membre.splice(index, 1);
                }
            }
        } return membre;
    }
    get_liste_membre() {
        return this.#liste_membre;
    }

    clear_horde() { this.#horde.clear(); this.#nb_zombies = 0; this.#liste_membre = []; }
    deplacer_horde(){
        if (this.#horde.get_suiv() != null) this.#horde.deplacer_horde()
    }

    inverser_horde() { this.#horde.inverser_positions();}

    get_nb_zombies() { return this.#nb_zombies }
    get_horde() { return this.#horde; }
    get_score() { return this.#score; }
    get_nb_memebre() { return this.#liste_membre.length }
    add_score(points) { this.#score += points; }
    initialiser_z_liste() {
        this.#liste_img_z = [
            "zombie_0",
            "zombie_1",
            "zombie_2",
            "zombie_3",
            "zombie_4",
            "zombie_5",
            "zombie_6",
            "zombie_7",
            "zombie_8",
            "zombie_9",
            "zombie_10",
            "zombie_11"
        ];
    }

    is_membre_in_horde(membre) {
        return this.#liste_membre.includes(membre)
    }
}
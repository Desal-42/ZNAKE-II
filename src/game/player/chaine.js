export class Chaine {
    #tete ; // string
    #position; // number[]
    #mouv = null;
    #suivant; // Chaine


    constructor(tete, position_x, position_y){ // tete : string, position_x : number, position_y : number
        this.#tete = tete;
        this.#position = [position_x, position_y];
        this.#mouv = null;
        this.#suivant = null;
    }

    get_mouv() { return this.#mouv; }
    set_mouv(mouv) { this.#mouv = mouv; }

    get_tete() { return this.#tete } // return string

    get_queue() {
        if (this.#suivant != null) return this.#suivant.get_queue();
        else return this;
    }
    get_suiv(){return this.#suivant;}

    get_position() { return this.#position}
    set_position(x, y) {
        this.#position[0] = x;
        this.#position[1] = y;
    }
    deplacer_horde(){
        if(this.get_suiv() != null){
            if(this.get_suiv().get_suiv() != null) this.get_suiv().deplacer_horde();
            const x = this.#position[0];
            const y = this.#position[1];
            this.get_suiv().set_position(x, y);
        }
    }
    inverser_positions() {
        // Collecte toutes les positions dans l'ordre
        let positions = [];
        let courant = this;
        while (courant != null) {
            positions.push([...courant.get_position()]); // ... servent ici à copier le tableau et pas la référence
            courant = courant.get_suiv();
        }
        // Réaffecte en ordre inverse
        positions.reverse();
        courant = this;
        for (let pos of positions) {
            courant.set_position(pos[0], pos[1]);
            courant = courant.get_suiv();
        }
    }

    /** --- [ fonction chaine ] --- **/
    get_size() {  // return number
        let taille = 1
        if (this.#suivant != null) taille = taille + this.#suivant.get_size();
        return taille;
    }
    append(c) { // c : Chaine  return void
        if (this.#suivant != null) this.#suivant.append(c);
        else this.#suivant = c;
    }
    pop() {
        if (this.get_suiv() != null) {
            if (this.get_suiv().get_suiv() == null) {
                const suivant = this.get_suiv().get_tete();
                this.#suivant = null;
                return suivant;
            } else return this.#suivant.pop();
        }
    }
    clear() {
        this.#suivant = null;
    }
}
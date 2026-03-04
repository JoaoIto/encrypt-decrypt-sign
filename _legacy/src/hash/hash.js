import { createHash } from "crypto";

function hashCreate(pwrd){
    return createHash('sha256').update(pwrd).digest('hex');
}

export let hashConsole = hashCreate("stro stro stro");


class User {
    constructor(name, password){
        this.name = name;
        this.hash = hashCreate(password);
    }

    auth(name, password){
        if(this.name == name && this.hash == hashCreate(password)){
            console.log("Sucess!")
            return true;
        }else{
            console.log("Fail! Not a true user!")
            return false;
        }
    }
}

const user = new User("Joao", "23082005");
console.log(user);

export let userAuth = user.auth("Joao", "23082005");
export let userAuthFake = user.auth("Joao", "2204582905");
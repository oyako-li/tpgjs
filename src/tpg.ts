import {v4 as uuid} from 'uuid';
import dash, { List } from 'lodash';

export interface Params {
    [name:string]: number;
}

export function flip(prob:number) {
    return Math.random() < prob;
}

export class Swarm<T> extends Set<T> {

    join(instance?:Swarm<T>|T){
        if(instance === undefined) {
            return;
        } else if(instance instanceof Swarm){
            for(const t of instance){
                this.add(t);
            }
        } else {
            this.add(instance);
        }
    }
    
    choice():T {
        const _set = Array.from(this);
        const _index = Math.floor(Math.random()*this.size);
        return _set[_index];
    }

    filter(func:(value:T)=>boolean):Swarm<T>{
        let _swarm = new Swarm<T>();
        for (const _value of this) {
            if (func(_value)) _swarm.add(_value);
        }
        return _swarm;
    }

    map(func:(value:T)=>any):Swarm<any>{
        let _swarm = new Swarm<any>();
        for (const value of this) {
            _swarm.add(func(value));
        }
        return _swarm;
    }

    reduce(func:(before:T,after:T)=>T):T{
        let result = [...this][0];
        for (const value of this) {
            result = func(result, value);
        }
        return result;
    }
}

export class Qualia {
    public fragment:Team|any;

    constructor(_instance:Qualia|Team|any) {
        if(_instance instanceof Qualia){

        } else if (_instance instanceof Team) {

        } else {

        }
    }

    public isAtomic() {
        if(this.fragment instanceof Team) {
            return false
        } else {
            return true
        }
    }
    
    public add(_fragment:Team|any) {
        this.fragment = _fragment;
    }
    
    public compose(state:any, visited:Swarm<string>, args:any):any {
        if (this.fragment instanceof Team) {
            return this.fragment.compose(state, visited, args)
        } else {
            return this.fragment
        }
    }

    public mutate(mutateParams?:Params) {
        // this.id=uuid();
        // const original = [...this.instructions];
        // for (let i=0; i<rampantReps; i++) {
        //     let deleted = this.mutationDelete(mutateParams['pLrnDel']);
        //     let selectionPool = learners
        //         .filter((lrn:Learner)=>!this.learners.has(lrn))
        //         .filter((lrn:Learner)=>!this.inLearners.has(lrn))
        //         .filter((lrn:Learner)=>!deleted.has(lrn));
        //     let added = this.mutationAdd(mutateParams['pLrnAdd'],mutateParams['maxTeamSize'], selectionPool);
        //     let [mutated, newed] = this.mutationMutate(mutateParams['pLrnMut'], mutateParams, teams);
        //     newLearner.join(newed);
        // }
        // return [rampantReps, newLearner]
    }
}

export class Program {
    public instructions:Array<any>;
    public id:string;

    constructor(_instance:Program|any) {
        if(_instance instanceof Program){
            this.instructions = [..._instance.instructions];
        } else {
            // TODO: 計算フィット
            this.instructions = Array.from({length: 40}, () => Math.floor(Math.random() * 40));
        }
        this.id=uuid();
    }
    
    public execute(state:any, args:any):number {
        return 1
    }

    public mutate(mutateParams:Params) {
        this.id=uuid();
        const original = [...this.instructions];

        while (dash.isEqual(this.instructions, original)) {
            if (this.instructions.length>1&&flip(mutateParams["pInstDel"])) {
                // this.instructions.reduce(
            }
        }
    }
}

export class Learner {
    public phrase:Qualia;
    public program:Program;
    public inTeam:Swarm<Team>;
    public bit:number;
    public id:string;

    constructor(_phrase?:Qualia,_program?:Program,_inTeam?:Swarm<Team>|Team) {
        this.phrase = new Qualia(_phrase);
        this.program = new Program(_program);
        this.inTeam = new Swarm<Team>();
        this.inTeam.join(_inTeam);
        this.id=uuid();
        this.bit=0;
    }

    public isAtomic():boolean {
        return this.phrase.isAtomic();
    }

    public mutate(mutateParams:Params, parentTeam:Team, teams:Swarm<Team>, pAtom:number) {
        let changed = false;
        while(!changed) {
            // mutate the program
            if(flip(mutateParams["pProgMut"])) {
                changed = true;
                this.program.mutate(mutateParams);
            }
            // mutate the phrase
            if(flip(mutateParams["pPhrMut"])) {
                changed = true;
                this.phrase.mutate(mutateParams);
            }
        }
    }

    public add(_team:Team) {
        _team.inLearners.add(this);
        this.phrase.add(this);
    }

    public bid(state:any, args:any): number{
        this.bit=this.program.execute(state,args);
        return this.bit;
    }

    public compose(state:any, visited:Swarm<string>, args:any): Qualia{
        return this.phrase.compose(state, visited, args);
    }

    public join(_inTeam:Swarm<Team>|Team) {
        this.inTeam.join(_inTeam);
    }

    public clone():Learner {
        return new Learner(
            this.phrase,
            this.program,
            this.inTeam
        )
    }
}

export class Team {
    public learners: Swarm<Learner>;
    public inLearners: Swarm<Learner>;
    public outcomes: Map<string,number>;
    public fitness: number|undefined;
    public id:string;
    private extinction: number;

    constructor(_learners?:Swarm<Learner>|Learner, _inLearners?:Swarm<Learner>|Learner, _outcomes?:Map<string,number>, _fitness?:number) {
        this.learners = new Swarm<Learner>();
        this.inLearners = new Swarm<Learner>();
        this.outcomes = new Map(_outcomes);
        this.fitness = _fitness;
        this.learners.join(_learners);
        this.inLearners.join(_inLearners);
        this.id = uuid();
        this.extinction=1.0;
    }

    public numAtomic():number {
        let num = 0;
        for (let lrn of this.learners) if (lrn.isAtomic()) num++;
        return num;
    }

    public compose(state:any, visited:Swarm<string>, args:any){
        visited.add(this.id);
        // this.extinction*=0.9;
        if(this.learners.size<1) {
            console.log('0 valid');
            this.add(new Learner());
        }

        const nonVisited = this.learners.filter(lrn=>lrn.isAtomic()||!visited.has(lrn.id));
        if (nonVisited.size<1) {
            const clone = this.learners.choice().clone();
            clone.phrase.mutate();
            this.add(clone);
            nonVisited.add(clone);
        }

        // bid calculate
        const topLearner:Learner = nonVisited
            .map(x=>{x.bid(state, args);return x})
            .reduce((before:Learner,after:Learner):Learner=>before.bit>after.bit?before:after);
        
        return topLearner.compose(state, visited, args);
    }

    public remove(learner:Learner):boolean {
        return learner.inTeam.delete(this) && this.learners.delete(learner);
    }

    public add(learner:Learner):void {
        learner.inTeam.add(this);
        this.learners.add(learner);
    }

    public join(_inLearner:Swarm<Learner>):void {
        for(const learner of _inLearner) learner.add(this);
        // _inLearner.join(this);
    }

    public clear():void {
        for(const learner of this.learners) learner.inTeam.delete(this);
        this.learners.clear();
    }

    public mutate(mutateParams:Params, learners:Swarm<Learner>, teams:Swarm<Team>): [number, Swarm<Learner>] {
        let rampantReps:number;
        let newLearner=new Swarm<Learner>();
        
        if (mutateParams['rampantGen']!==0 && mutateParams['rampantMin']>mutateParams['rampantMax']) {
            throw Error("Min rampant iterations is greater than max rampant iterations!");
        }
        if (
            mutateParams['rampantGen'] > 0 &&
            mutateParams['generation'] % mutateParams['rampantGen'] === 0 &&
            mutateParams['generation'] > mutateParams['rampantGen']
        ) {
            rampantReps = mutateParams['rampantMax']?
                Math.floor(Math.random()*(mutateParams['rampantMax']-mutateParams['rampantMin']+1)+mutateParams['rampantMin']):
                mutateParams['rampantMin'];
        } else {
            rampantReps=1;
        }


        for (let i=0; i<rampantReps; i++) {
            let deleted = this.mutationDelete(mutateParams['pLrnDel']);
            let selectionPool = learners
                .filter(lrn=>!this.learners.has(lrn))
                .filter(lrn=>!this.inLearners.has(lrn))
                .filter(lrn=>!deleted.has(lrn));
            let added = this.mutationAdd(mutateParams['pLrnAdd'],mutateParams['maxTeamSize'], selectionPool);
            let [mutated, _new] = this.mutationMutate(mutateParams['pLrnMut'], mutateParams, teams);
            newLearner.join(_new);
        }
        return [rampantReps, newLearner]
    }

    private mutationDelete(prob:number):Swarm<Learner> {
        let preProb = prob;
        let delLearner=new Swarm<Learner>();

        if(prob==0.0) return delLearner;
        else if (prob >= 1.0) throw Error("pLrnDel is greater than or equal to 1.0!");
        else if (this.numAtomic()<1) throw Error("Less than one atomic in team! This shouldn't happen");
        
        
        while (flip(prob)&&(this.learners.size>2)) {
            prob *= preProb;
            let select:Learner;
            if (this.numAtomic()>1) {
                select = this.learners.choice();
            } else {
                select = this.learners.filter(lrn=>!lrn.isAtomic()).choice();
            }
            delLearner.add(select);
            this.remove(select);
        }

        return delLearner;
    }

    private mutationAdd(prob:number, maxTeamSize:number, selectionPool:Swarm<Learner>):Swarm<Learner> {
        let preProb = prob;
        let addLearner=new Swarm<Learner>();

        if(
            prob==0.0 ||
            selectionPool.size === 0 ||
            (maxTeamSize>0 && this.learners.size >= maxTeamSize)
        ) return addLearner;
        else if (prob >= 1.0) throw Error("pLrnAdd is greater than or equal to 1.0!");
        
        while (
            flip(prob) &&
            (maxTeamSize<=0 || this.learners.size < maxTeamSize)
        ) {
            if(this.learners.size===0) break;
            prob*=preProb;
            let learner = selectionPool.choice();
            selectionPool.delete(learner);

            this.add(learner);
        }

        return addLearner;
    }

    private mutationMutate(prob:number, mutateParams:Params, teams:Swarm<Team>):[Swarm<Learner>, Swarm<Learner>]{
        let mutLearner=new Swarm<Learner>();
        let mtdLearner=new Swarm<Learner>();
        let origin = new Swarm<Learner>(this.learners);

        for(const learner of origin) {
            if(flip(prob)) {
                let pAtom:number|undefined;
                if(this.numAtomic()===1&&learner.isAtomic()) pAtom=1.1;
                else pAtom = mutateParams['pAtom'];

                const newLearner = learner.clone();
                this.add(newLearner);
                newLearner.mutate(mutateParams, this, teams, pAtom);
                mutLearner.add(learner);
                mtdLearner.add(newLearner);
            }
        }
        return [mutLearner, mtdLearner]
    }

}

export class Agent {
    public score: number;
    private args: any[];
    private visited:Swarm<string>;
    
    constructor(private readonly team:Team, ...args:any[]){
        this.team = team;
        this.score = 0.0;
        this.args = args;
        this.visited = new Swarm<string>();
    }

    public describe(){
        console.log(`${this.constructor.name}: {${this.team.id}, ${this.score}}`)
    }

    public compose(state:any){
        return this.team.compose(state,this.visited,this.args)
    }

    public reward(task:string='task') {
        this.team.outcomes.set(task, this.score);
    }

    get id() {
        return this.team.id;
    }
}

export class Tpg {
    public teams:Swarm<Team>;
    public learners:Swarm<Learner>;
    public phrases:Swarm<Qualia>;
    private teamPopSize:number;

    constructor() {
        this.teamPopSize=10;
        this.teams=new Swarm<Team>();
        this.learners=new Swarm<Learner>();
        this.phrases=new Swarm<Qualia>();
    }


    private initialize() {
        for(let i=0; i<this.teamPopSize; i++) {
            
        }
    }
}

if (require.main === module) {
    console.log('hello world');
    console.log(dash.isEqual('h','h'));
}
import { useSwordWeirdosRepo } from "@/stores/swordWeirdosRepo"
import Warband from "./Warband";
let swordRepo = useSwordWeirdosRepo()


import { evaluate, max } from "mathjs";
export enum StatModState { Enable, Disable }
export enum WeaponModState { Add, Delete, Purchasable, NonPurchasable }
export class StatMod {
    public name: string = ""
    public state: StatModState = StatModState.Enable
    public level: number = 0
}
export class WeaponMod {
    public name: string = ""
    public state: WeaponModState = WeaponModState.Add
    public weaponProperty: string | undefined = undefined
}
export class WarbandEntityModifiers {
    public statMods: StatMod[] = []
    public weaponProfiencies: string[] = []
    public weaponMod: WeaponMod[] = []
    public spells: string[] = []
    public maneuver: string[] = []
    public classes: string[] = []
    public pointsMod: ((x: number) => number)[] = []
    public classMax: number | undefined = undefined
    public append(otherMod: WarbandEntityModifiers) {
        this.statMods = [...this.statMods, ...otherMod.statMods]
        this.weaponProfiencies = [...this.weaponProfiencies, ...otherMod.weaponProfiencies]
        this.weaponMod = [...this.weaponMod, ...otherMod.weaponMod]
        this.spells = [...this.spells, ...otherMod.spells]
        this.maneuver = [...this.maneuver, ...otherMod.maneuver]
        this.classes = [...this.classes, ...otherMod.classes]
        this.pointsMod = [...this.pointsMod, ...otherMod.pointsMod]
        if (otherMod.classMax != undefined) {
            this.classMax = otherMod.classMax
        }
    }
}
export default class WarbandEntity {
    static id_counter: number = 0;
    public id: number = WarbandEntity.id_counter++;
    public speedLevel: number = 1;
    public mightLevel: number = 1;
    public defenseLevel: number = 1;
    public willpowerLevel: number = 1;
    public name: string = "";
    public isPowerful: boolean = false;
    public isLeader: boolean = false;
    public leaderTrait: string = "";
    public classes: string[] = [];
    public weapons: string[] = [];
    public spells: string[] = [];
    public containingWarband: Warband | undefined = undefined;

    public getMaxSpellNumber(): number {
        var currentSpellCosts = 0;
        for (const myClass of this.classes) {
            var maxSpellCost = swordRepo.getClassWithID(myClass)?.max_spell_cost
            if (maxSpellCost != undefined && maxSpellCost > currentSpellCosts) {
                currentSpellCosts = maxSpellCost
            }
        }

        return currentSpellCosts;
    }

    public getPoints(): number {
        let classesCost = this.classes.map((x) => swordRepo.getClassWithID(x).pts).reduce((x, y) => x + y, 0)
        let weaponCost = this.weapons.map((x) => swordRepo.getWeaponWithID(x).pts).reduce((x, y) => x + y, 0)
        let spellCost = this.spells.map((x) => swordRepo.getSpellWithID(x).pts).reduce((x, y) => x + y, 0)
        let statCost = swordRepo.getStatWithLevel("speed", this.speedLevel).pts + swordRepo.getStatWithLevel("might", this.mightLevel).pts +
            swordRepo.getStatWithLevel("defense", this.defenseLevel).pts + swordRepo.getStatWithLevel("willpower", this.willpowerLevel).pts
        var cost = classesCost + weaponCost + statCost + spellCost
        for (const mod of this.getModifiers().pointsMod) {
            cost = mod(cost)
        }
        return cost
    }

    private getModifierFromObject(obj: any, skipManeuverModifier = false) {
        var modifiers = new WarbandEntityModifiers()

        if (obj == undefined) return modifiers
        if (obj.spells != undefined) modifiers.spells = [...modifiers.spells, ...obj.spells]
        if (obj.maneuver != undefined && !skipManeuverModifier) modifiers.maneuver = [...modifiers.maneuver, ...obj.maneuver]
        if (obj["weapon-proficiencies"] != undefined) modifiers.weaponProfiencies = [...modifiers.weaponProfiencies, ...obj["weapon-proficiencies"]]
        if (obj.classes != undefined) modifiers.classes = [...modifiers.classes, ...obj.classes]
        if (obj["pts-change"] != undefined) modifiers.pointsMod.push((pts: number) => evaluate(obj["pts-change"], { "x": pts, "pts": pts }))
        if (obj["class-max"] != undefined) modifiers.classMax = obj["class-max"]
        if (obj["stat-mod"] != undefined) {
            for (const statMod of obj["stat-mod"]) {
                var mod = new StatMod()
                mod.name = statMod.name
                if (statMod["enable-level"] != undefined) {
                    mod.state = StatModState.Enable
                    mod.level = statMod["enable-level"]
                }
                else {
                    mod.state = StatModState.Disable
                    mod.level = statMod["disable-level"]
                }
                modifiers.statMods.push(mod)
            }
        }
        if (obj["weapon-mod"] != undefined) {
            for (const statMod of obj["weapon-mod"]) {
                var weaponMod = new WeaponMod()
                weaponMod.name = statMod.name
                if (statMod["add-prop"] != undefined) {
                    weaponMod.state = WeaponModState.Add
                    weaponMod.weaponProperty = statMod["add-prop"]
                }
                else if (statMod["del-prop"] != undefined) {
                    weaponMod.state = WeaponModState.Delete
                    weaponMod.weaponProperty = statMod["del-prop"]
                }
                else if (statMod["purchasable"] != undefined) {
                    weaponMod.state = WeaponModState.Purchasable
                }
                else {
                    weaponMod.state = WeaponModState.NonPurchasable
                }
                modifiers.weaponMod.push(weaponMod)
            }
        }
        return modifiers
    }

    public getModifiers(): WarbandEntityModifiers {
        var modifiers = new WarbandEntityModifiers()
        if (this.leaderTrait != undefined)
            modifiers.append(this.getModifierFromObject(swordRepo.getLeaderTraitWithID(this.leaderTrait)))
        if (this.containingWarband != undefined && this.containingWarband.warbandTrait != undefined)
            modifiers.append(this.getModifierFromObject(swordRepo.getWarbandTraitWithID(this.containingWarband.warbandTrait)))
        for (const classId of this.classes) {
            modifiers.append(this.getModifierFromObject(swordRepo.getClassWithID(classId)))
        }
        for (const weaponId of this.weapons) {
            modifiers.append(this.getModifierFromObject(swordRepo.getWeaponWithID(weaponId), true))
        }
        return modifiers
    }

    public getMaxClasses() {
        var maxClasses = this.isPowerful || this.isLeader ? 2 : 1
        
        var maxClassMod = this.getModifiers().classMax
        if (maxClassMod != undefined) {
            maxClasses = maxClassMod
        }
        return maxClasses
    }
    public getComputedClasses() {
        return [...this.classes, ...(this.getModifiers().classes)]
    }
    public getComputedSpells() {
        return [...this.spells, ...(this.getModifiers().spells)].map(spellID => swordRepo.getSpellWithID(spellID)).filter(s => s != undefined)
    }


    public getComputedWeapons() {
        return this.weapons.map(id => swordRepo.getWeaponWithID(id)).filter(w => w != undefined)

    }

    public getComputedProperty(weapon) {
        var properties = [...weapon.properties]
        const mods = this.getModifiers()
        for (const weaponMod of mods.weaponMod) {
            if (weaponMod.name == weapon.id && weaponMod.weaponProperty != undefined) {
                if (weaponMod.state == WeaponModState.Add) {
                    properties.push(weaponMod.weaponProperty)
                }
                else if (weaponMod.state == WeaponModState.Delete) {
                    const index = properties.indexOf(weaponMod.weaponProperty)
                    if (index !== -1) {
                        properties.splice(index, 1)
                    }
                }
            }
        }
        return properties.map(id => swordRepo.getWeaponsPropertyWithID(id)).filter(p => p != undefined)
    }
    public getComputedManeuver(weapon) {
        return [...this.getModifiers().maneuver, ...weapon.maneuver].map(maneuverID => swordRepo.getManeuverWithID(maneuverID)).filter(m => m != undefined)
    }


    public update() {
        // remove spells, if the maxSpellNumber was updated 
        var maxSpellNumer = this.getMaxSpellNumber();
        for (const spellId of this.spells) {
            var spell = swordRepo.getSpellWithID(spellId)
            if (spell != undefined && spell.pts > maxSpellNumer) {
                var index = this.spells.indexOf(spell.id);
                if (index !== -1) {
                    this.spells.splice(index, 1);
                }
            }
        }
        // update stats, if the where restricted after picking a class.

    }
    public toJSON() {
        return {
            id: this.id,
            speedLevel: this.speedLevel,
            mightLevel: this.mightLevel,
            defenseLevel: this.defenseLevel,
            willpowerLevel: this.willpowerLevel,
            name: this.name,
            isPowerful: this.isPowerful,
            isLeader: this.isLeader,
            leaderTrait: this.leaderTrait,
            classes: [...this.classes],
            weapons: [...this.weapons],
            spells: [...this.spells]
        }
    }
    static fromJSON(data: any): WarbandEntity {
        const entity = new WarbandEntity()

        entity.id = data.id
        entity.speedLevel = data.speedLevel
        entity.mightLevel = data.mightLevel
        entity.defenseLevel = data.defenseLevel
        entity.willpowerLevel = data.willpowerLevel
        entity.name = data.name
        entity.isPowerful = data.isPowerful
        entity.isLeader = data.isLeader
        entity.leaderTrait = data.leaderTrait
        entity.classes = [...data.classes]
        entity.weapons = [...data.weapons]
        entity.spells = [...data.spells]

        return entity
    }

}
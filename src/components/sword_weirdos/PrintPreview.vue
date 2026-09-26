<script setup lang="ts">
import Warband from "@/model/Warband";
const warbandModel = defineModel<Warband>();

import { useSwordWeirdosRepo } from '@/stores/swordWeirdosRepo';
import { usePaperizer } from 'paperizer';

const swordWeirdoRepo = useSwordWeirdosRepo();

const { paperize } = usePaperizer('toPrint', {
  styles: [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
  ]
});

function removeDoublesFromIDObj(objArray: { id: String }[]) {
  var availableIds: String[] = []
  var filteredAllProps = []
  for (const obj of objArray) {
    if (obj == undefined) continue
    if (!availableIds.find(x => obj.id == x)) {
      availableIds.push(obj.id)
      filteredAllProps.push(obj)
    }
  }
  return filteredAllProps
}

function getAllUsedClasses() {
  return removeDoublesFromIDObj(warbandModel.value.entities.reduce((accumulator, entity) => [...accumulator, ...(entity.getComputedClasses().map(classID => swordWeirdoRepo.getClassWithID(classID)))], []))
}

function getAllSpellsUsedSpells() {
  return removeDoublesFromIDObj(warbandModel.value.entities.reduce((accumulator, entity) => [...accumulator, ...(entity.getComputedSpells())], []))
}

function getAllUsedWeaponProperties() {
  var allProps = []
  for (const entity of warbandModel.value.entities) {
    for (const weapon of entity.getComputedWeapons()) {
      var weaponPropertyArray = entity.getComputedProperty(weapon)
      var maneuverArray = entity.getComputedManeuver(weapon)
      allProps = [...allProps, ...weaponPropertyArray,...maneuverArray]
    }
  }

  return removeDoublesFromIDObj(allProps)
}

function mapStatValueToDiceName(statName: string, statValue: number) {
  return swordWeirdoRepo.stats[statName?.toLowerCase()].filter(val => val.level === statValue)[0].dice;
}

function print() {
  paperize();
//handlePrint() // vuetoprint
}

defineExpose({ print });
</script>

<template>
  <v-container id="toPrint" class="p-3">
    <h2 class="mb-3">Warband Sheet: {{ warbandModel.name || 'Unnamed Warband' }}</h2>

    <table class="table table-bordered table-sm">
      <thead class="table-light">
        <tr>
          <th>Name</th>
          <th>Spd</th>
          <th>Mgt</th>
          <th>Def</th>
          <th>Wp</th>
          <th>Classes</th>
          <th>Weapons</th>
          <th>Spells</th>
          <th>Leader Trait</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in warbandModel?.entities" :key="item.name">
          <td>{{ item.name }} ({{ item.getPoints() }})</td>
          <td>{{ item.speedLevel }}</td>
          <td>{{ mapStatValueToDiceName('might', item.mightLevel) }}</td>
          <td>{{ mapStatValueToDiceName('defense', item.defenseLevel) }}</td>
          <td>{{ mapStatValueToDiceName('willpower', item.willpowerLevel) }}</td>
          <td>{{ item.getComputedClasses().map(str => swordWeirdoRepo.getClassWithID(str)?.name).join(', ') }}</td>
          <td>
            <ul class="list-unstyled mb-0">
              <li v-for="weapon in item.getComputedWeapons()" :key="weapon.name">
                {{ weapon.name }}
                <span v-if="item.getComputedProperty(weapon).length">[{{ item.getComputedProperty(weapon).map(x => x.name).join(', ') }}]</span>
                <span v-if="item.getComputedManeuver(weapon).length">({{ item.getComputedManeuver(weapon).map(m => m?.name).join(', ') }})</span>
              </li>
            </ul>
          </td>
          <td>{{ item.getComputedSpells().map(spell => spell?.name).join(', ') }}</td>
          <td>
            <strong>{{ swordWeirdoRepo.getLeaderTraitWithID(item.leaderTrait)?.name }}</strong><br>
            {{ swordWeirdoRepo.getLeaderTraitWithID(item.leaderTrait)?.effect }}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="row mt-4">
      <div class="col-md-4" v-if="getAllUsedClasses().length">
        <h5>Classes</h5>
        <ul class="list-unstyled">
          <li v-for="cls in getAllUsedClasses()" :key="cls.id">
            <strong>{{ cls.name }}</strong>: {{ cls.effect }}
          </li>
        </ul>
      </div>
      <div class="col-md-4" v-if="getAllSpellsUsedSpells().length">
        <h5>Spells</h5>
        <ul class="list-unstyled">
          <li v-for="spell in getAllSpellsUsedSpells()" :key="spell.id">
            <strong>{{ spell.name }}</strong>: {{ spell.effect }}
          </li>
        </ul>
      </div>
      <div class="col-md-4" v-if="getAllUsedWeaponProperties().length">
        <h5>Weapon Properties</h5>
        <ul class="list-unstyled">
          <li v-for="prop in getAllUsedWeaponProperties()" :key="prop.id">
            <strong>{{ prop.name }}</strong>: {{ prop.effect }}
          </li>
        </ul>
      </div>
    </div>

    <div class="mt-3">
      <strong>Total Points:</strong> {{ warbandModel.entities.reduce((sum, e) => sum + e.getPoints(), 0) }}
    </div>
  </v-container>
</template>

<style>
/* ================== Alle Druck-Stile ================== */
@media print {
  /* Seiten-Einstellungen */
  @page {
    size: A4;
    margin: 10mm;
  }

  body {
    background: white !important;
    color: black !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-size: 12pt;
  }

  /* UI-Elemente ausblenden */
  .v-app-bar, .v-btn, .v-footer, .v-navigation-drawer {
    display: none !important;
  }

  /* Druckbereich */
  #toPrint {
    background: white !important;
    color: black !important;
    width: 210mm;
    margin: 0 auto;
    padding: 10mm;
  }

  /* Tabellen */
  table {
    border: 1px solid black !important;
    border-collapse: collapse !important;
    background: white !important;
  }

  th, td {
    border: 1px solid black !important;
    padding: 4px !important;
    text-align: left;
    color: black !important;
  }

  ul {
    padding-left: 15px !important;
    margin: 0 !important;
  }

  h2, h5, strong {
    color: black !important;
    page-break-inside: avoid;
  }

  tr {
    page-break-inside: avoid !important;
  }
}
</style>
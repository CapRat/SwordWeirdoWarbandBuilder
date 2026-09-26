<script lang="ts" setup>
import WarbandEntityPreview from '@/components/sword_weirdos/WarbandEntityList.vue';
import PrintPreview from '@/components/sword_weirdos/PrintPreview.vue';
import WarbandConfig from '@/components/sword_weirdos/WarbandConfig.vue';
import InfoDialog from '@/components/sword_weirdos/InfoDialog.vue';
import WarbandEntity from '@/model/WarbandEntity';
import Warband from '@/model/Warband';
import FileUploadDialogue from './FileUploadDialogue.vue';
import { useSwordWeirdosRepo } from '@/stores/swordWeirdosRepo';

const swordWeirdoRepo = useSwordWeirdosRepo()

const warbandModel = ref<Warband>(new Warband())
const showWarbandConfig = ref<boolean>(true)
const showWarbandUploadDialog = ref(false)
const showRepoUploadDialog = ref(false)

const index = ref(-1)
const preview = ref(false)
const previewLight = ref(true)
const printRef = ref(null)
function callPrint() {
  printRef.value?.print()
}
function removeWarbandEntity(warbandEntity: WarbandEntity) {

  var warbandIndex = warbandModel.value.entities.indexOf(warbandEntity)
  if (warbandIndex < index.value) {
    index.value--
  }
  if (warbandIndex == index.value && index.value >= (warbandModel.value.entities.length - 1)) {
    index.value--
  }

  warbandModel.value.entities.splice(warbandIndex, 1);
}
function stringifyWarband(): undefined | string {
  return JSON.stringify(warbandModel.value.toJSON())
}
function getCurrentWarbandDownloadName(): string {
  return (warbandModel.value.name ===""? "unnamed":warbandModel.value.name)+ "-Warband.json"
}


function loadWarband(content: string) {
  try {
    const json = JSON.parse(content)

    // hier dein Import
    warbandModel.value = Warband.fromJSON(json)

    console.log("Warband geladen", json)

  } catch (err) {
    console.error("Ungültige JSON Datei", err)
  }

  showWarbandUploadDialog.value = false
}

function loadRepo(content: string) {
  try {
    swordWeirdoRepo.updateSwordWeirdoRepo(content)
    console.log("Repo geladen", content)

  } catch (err) {
    console.error("Ungültige JSON Datei", err)
  }

  showRepoUploadDialog.value = false
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}



</script>

<template>
  <v-app-bar :elevation="0">


    <v-app-bar-title> <v-btn variant="plain" href="https://www.drivethrurpg.com/en/product/437324/sword-weirdos">
        Sword-Weirdos Generator</v-btn></v-app-bar-title>
  <template v-slot:prepend>
    <v-app-bar-nav-icon></v-app-bar-nav-icon>
  </template>
    <template v-slot:append>
      <v-btn v-if="preview" :icon="previewLight ? 'mdi-weather-night' : 'mdi-weather-sunny'"
        @click="previewLight = !previewLight" :title="previewLight ? 'Dark preview' : 'Light preview'"></v-btn>
      <v-btn v-if="preview" icon="mdi-printer" @click="callPrint()"></v-btn>
      <v-btn @click="preview = !preview" icon="mdi-eye" :color="preview ? 'primary' : ''"></v-btn>
      <v-menu width="400">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" icon="mdi-dots-vertical"></v-btn>
        </template>
        <v-list>
          <v-list-item>
            <v-btn text="Create New Warband" @click="warbandModel = new Warband()" />
          </v-list-item>
          <v-list-item>
            <v-btn text="Download Warband" @click="download(getCurrentWarbandDownloadName(), stringifyWarband())" />
          </v-list-item>
          <v-list-item>
            <v-btn text="Upload Warband" @click="showWarbandUploadDialog = true" />
          </v-list-item>
          <v-list-item>
            <v-btn text="Upload new Ruleset" @click="showRepoUploadDialog = true" />
          </v-list-item>
          <v-list-item>
            <v-btn text="Download Ruleset"
              @click="download('CurrentSwordWeirdoRuleSet.json', swordWeirdoRepo.getCurrentStoreAsString())" />
          </v-list-item>
          <v-list-item>
            <InfoDialog> </InfoDialog>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>

  </v-app-bar>

  <FileUploadDialogue v-model="showWarbandUploadDialog" @content-loaded="loadWarband" dialog-title="Import Warband"  />
  <FileUploadDialogue v-model="showRepoUploadDialog" @content-loaded="loadRepo" dialog-title="Import new Ruleset"  />
  <v-container v-if="!preview">
    <v-alert v-for="error in warbandModel.getErrors()" :text="error" type="error"></v-alert>
    <v-alert v-for="warning in warbandModel.getWarnings()" :text="warning" type="warning"></v-alert>
    <v-row no-gutters>
      <v-col>
        <v-container min-width="300px">
          <h1>{{ warbandModel.name != undefined && warbandModel.name != "" ? warbandModel.name : "Warband" }}<v-icon
              @click="showWarbandConfig = true" class="ma-1 pa-3 pb-6" size="x-small">mdi-pencil</v-icon></h1>
          <h4>{{ swordWeirdoRepo.getWarbandTraitWithID(warbandModel.warbandTrait)?.name }}</h4>
          <WarbandConfig v-model:show="showWarbandConfig" v-model="warbandModel"></WarbandConfig>
          <WarbandEntityPreview v-model="warbandModel.entities"
            @add-warband-entity="(warbandEntity) => warbandEntity.containingWarband = warbandModel"
            @remove-warband-entity="(warbandEntity) => removeWarbandEntity(warbandEntity)" v-model:index="index" />
        </v-container>
      </v-col>
      <v-col>


        <WarbandEntityCofiguration v-model="warbandModel.entities[index]" />
      </v-col>
    </v-row>



  </v-container>
  <v-theme-provider v-if="preview" :theme="previewLight ? 'light' : 'dark'" with-background>
    <PrintPreview v-model="warbandModel" ref="printRef"></PrintPreview>
  </v-theme-provider>

</template>
<style>
.v-list-item {
  white-space: normal;
  font-size: 18px;
}
</style>
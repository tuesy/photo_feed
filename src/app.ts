/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

const fetch = require('node-fetch');
const url = require('url')
const PHOTOS_URL = 'https://account.altvr.com/api/public/photos?'

/**
 * The structure of a world entry in the world database.
 */
type WorldDescriptor = {
    description: string;
    favorited: number;
    image: string;
    name: string;
    userDisplayName: string;
    userUsername: string;
    visited: number;
    worldId: string;
};

type PhotoDescriptor = {
    photoId: string;
    name: string;
    image: string;
    worldId: string;
};


/**
 * The main class of this app. All the logic goes here.
 */
export default class WorldSearch {
  private assets: MRE.AssetContainer;

  private libraryActors: MRE.Actor[] = [];

  // Load the database.
  // tslint:disable-next-line:no-var-requires variable-name
  private photoDatabase: { [key: string]: PhotoDescriptor } = {};

  private teleporterSpacing = 0.8;
  private teleporterScale = {x: 0.5, y: 0.5, z: 0.5};
  private maxResults = 25;
  private previewImageWidth = 1.4;
  private previewImageHeight = 1;
  private previewImageDepth = 0.02;
  private previewImagePosition = {y: 2};
  private moreInfoHeight = 0.2;
  private moreInfoPosition = {y: 2.8};

  constructor(private context: MRE.Context, private params: MRE.ParameterSet) {
    this.context.onStarted(() => this.started());
  }

  /**
   * Once the context is "started", initialize the app.
   */
  private async started() {
    // set up somewhere to store loaded assets (meshes, textures, animations, gltfs, etc.)
    this.assets = new MRE.AssetContainer(this.context);

    const textButton = MRE.Actor.Create(this.context, {
      actor: {
        name: 'searchButton',
        transform: { local: { position: { x: 0, y: 1, z: -1 } } },
        collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 0.5, y: 0.2, z: 0.01 } } },
        text: {
          contents: "Search",
          height: 0.1,
          anchor: MRE.TextAnchorLocation.MiddleCenter,
          justify: MRE.TextJustify.Center
        }
      }
    });
    textButton.setBehavior(MRE.ButtonBehavior).onClick(user => {
      user.prompt("Search photos by hashtag...", true)
      .then(res => {

          if(res.submitted){
            textButton.text.contents =
              `Search\n\nResults for \"${res.text}\"`;
            this.search(res.text);
          }
          else{
            // user clicked 'Cancel'
          }

      })
      .catch(err => {
        console.error(err);
      });
    });

    // allow the user to preset a query
    if(this.params.q){
      //console.log(`Hashtag=${this.params.q}`)
      this.search(String(this.params.q));
    }
  }

  // search for worlds and spawn teleporters
  private search(query: string) {
    // clear existing teleporters
    for (const actor of this.libraryActors) {
      actor.destroy();
    }

    // clear world data
    this.photoDatabase = {};

    // query public worlds search api
    let uri = PHOTOS_URL + new url.URLSearchParams({ hashtag: query, per: this.maxResults });
    fetch(uri)
      .then((res: any) => res.json())
      .then((json: any) => {
        console.log(json);
        if(json.photos){
          for(const photo of json['photos']){
              this.photoDatabase[photo.photo_id] = {
                  // 'description': String(world.description),
                  // 'favorited': Number(world.favorited),
                  'image': String(photo.image_original),
                  'name': String(photo.name),
                  // 'userDisplayName': String(world.first_name),
                  // 'userUsername': String(world.username),
                  // 'visited': Number(world.visited),
                  'photoId': String(photo.photo_id)
              }
          }

          // where all the magic happens
          // Loop over the database
          let x = this.teleporterSpacing;
          for (const photoId of Object.keys(this.photoDatabase)) {
              const photoRecord = this.photoDatabase[photoId];

              console.log(photoRecord.image);

              this.spawn('Teleporter to ' + photoRecord.name, photoId,
                  { x: x, y: 0.0, z: 0.0}, { x: 0.0, y: 180, z: 0.0}, this.teleporterScale)
              x += this.teleporterSpacing;
          }
        }
        else if (json.status == '404'){
          // 404 is a normal HTTP response so you can't 'catch' it
          console.log("ERROR: received a 404 for " + uri)
        }
      });
  }

  private spawn(name: string, photoId: string, position: any, rotation: any, scale: any){
    let photo = this.photoDatabase[photoId];

    // spawn teleporter
    let tp = MRE.Actor.CreateFromLibrary(this.context, {

        resourceId: 'teleporter:space/1498987735254302829?label=true',
        // resourceId: 'teleporter:space/' + photoId + '?label=true',
        actor: {
            name: name,
            transform: {
                local: {
                    position: position,
                    rotation: MRE.Quaternion.FromEulerAngles(
                        rotation.x * MRE.DegreesToRadians,
                        rotation.y * MRE.DegreesToRadians,
                        rotation.z * MRE.DegreesToRadians),
                    scale: scale
                }
            }
        }
    });
    this.libraryActors.push(tp);

    // spawn preview image
    const tex = this.assets.createTexture('previewTexture', {uri: photo.image});
    const mat = this.assets.createMaterial('previewMaterial', {
      color: MRE.Color3.Black(),
      emissiveColor: MRE.Color3.White(),
      emissiveTextureId: tex.id
    });
    const mesh = this.assets.createBoxMesh('window', this.previewImageWidth, this.previewImageHeight, this.previewImageDepth);
    MRE.Actor.Create(this.context, {
      actor: {
        name: 'window',
        parentId: tp.id,
        appearance: {
          meshId: mesh.id,
          materialId: mat.id
        },
        transform: {
          local: {
            position: this.previewImagePosition
          }
        }
      }
    });
  }
}
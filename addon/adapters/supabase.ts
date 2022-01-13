import JSONAPIAdapter from '@ember-data/adapter/json-api';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import { pluralize } from 'ember-inflector';

import type SupabaseService from 'ember-supabase/services/supabase';
import type Store from '@ember-data/store';
import type ModelRegistry from 'ember-data/types/registries/model';
import type DS from 'ember-data';
import type { SupabaseQueryBuilder } from '@supabase/supabase-js/dist/main/lib/SupabaseQueryBuilder';

type ModelClass = any;

interface AdapterOptions {
  realtime?: boolean;
}

type SnapshotRecordArray<K extends keyof ModelRegistry> =
  DS.SnapshotRecordArray<K> & { adapterOptions?: AdapterOptions };

export default class SupabaseAdapter extends JSONAPIAdapter {
  @service declare supabase: SupabaseService;

  createRecord<K extends keyof ModelRegistry>(
    _store: Store,
    type: ModelClass,
    snapshot: DS.Snapshot<K>
  ): RSVP.Promise<any> {
    return new RSVP.Promise((resolve, reject) => {
      const serialized = this.serialize(snapshot, { includeId: true });
      this.buildRef(type.modelName)
        .insert([serialized])
        .then(({ data, error }) => {
          if (error || !data) {
            reject(error);
          } else {
            resolve(data[0]);
          }
        });
    });
  }

  updateRecord<K extends keyof ModelRegistry>(
    _store: Store,
    type: ModelClass,
    snapshot: DS.Snapshot<K>
  ): RSVP.Promise<any> {
    return new RSVP.Promise((resolve, reject) => {
      const serialized = this.serialize(snapshot, { includeId: true });
      this.buildRef(type.modelName)
        .update([serialized])
        .match({ id: snapshot.id })
        .then(({ data, error }) => {
          if (error || !data) {
            reject(error);
          } else {
            resolve(data[0]);
          }
        });
    });
  }

  deleteRecord<K extends keyof ModelRegistry>(
    _store: Store,
    type: ModelClass,
    snapshot: DS.Snapshot<K>
  ): RSVP.Promise<any> {
    return new RSVP.Promise((resolve, reject) => {
      this.buildRef(type.modelName)
        .delete()
        .match({ id: snapshot.id })
        .then(({ data, error }) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
    });
  }

  findRecord<K extends keyof ModelRegistry>(
    _store: Store,
    type: ModelClass,
    id: string,
    _snapshot: DS.Snapshot<K>
  ): RSVP.Promise<any> {
    return new RSVP.Promise((resolve, reject) => {
      this.buildRef(type.modelName)
        .select()
        .match({ id })
        .then(({ data, error }) => {
          if (error || !data) {
            reject(error);
          } else {
            resolve(data[0]);
          }
        });
    });
  }

  findAll<K extends keyof ModelRegistry>(
    _store: Store,
    type: ModelClass,
    _sinceToken: string,
    snapshotRecordArray: SnapshotRecordArray<K>
  ): RSVP.Promise<any> {
    return new RSVP.Promise((resolve, reject) => {
      this.buildRef(type.modelName)
        .select()
        .then(({ data, error }) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });

      if (snapshotRecordArray?.adapterOptions?.realtime) {
        this.buildRef(type.modelName)
          .on('*', (payload) => {
            console.log('HIT', payload)
            resolve(payload.new);
          })
          .subscribe();
      }
    });
  }

  findHasMany(
    _store: Store,
    snapshot: any,
    _url: string,
    relationship: any
  ): RSVP.Promise<unknown> {
    return new RSVP.Promise((resolve, reject) => {
      this.buildRef(relationship.type)
        .select()
        .eq(relationship.__inverseKey, snapshot.id)
        .then(({ data, error }) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
    });
  }

  protected buildRef(modelName: string): SupabaseQueryBuilder<any> {
    return this.supabase.client.from(pluralize(modelName));
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your adapters.
declare module 'ember-data/types/registries/adapter' {
  export default interface AdapterRegistry {
    supabase: SupabaseAdapter;
  }
}

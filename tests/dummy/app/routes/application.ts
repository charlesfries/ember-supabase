import Route from '@ember/routing/route';

export default class ApplicationRoute extends Route {
  beforeModel() {
    const post = this.store.createRecord('post', {
      title: 'The Title',
      body: 'The Body',
    });
    return post.save();
  }

  model() {
    return this.store.findAll('post', {
      adapterOptions: {
        realtime: true,
      }
    });
  }
}

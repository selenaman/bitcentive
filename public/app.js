/* global window */
import 'can-define-stream';
import canStream from 'can-stream';
import DefineMap from 'can-define/map/';
import route from 'can-route';
// import 'can-route-pushstate';
import Session from 'bitcentive/models/session';
// import 'bitcentive/models/fixtures/';

// viewmodel debugging
import viewModel from 'can-view-model';
window.viewModel = viewModel;

var pages = {
  home: 'public',
  dashboard: 'private',
  contributors: 'private'
};

const AppViewModel = DefineMap.extend({

  /**
   * By default, viewModel attributes will not be serialized into the URL as
   * route attributes.
   */
  '*': {
    serialize: false
  },

  // Once https://github.com/canjs/can-define-stream/issues/15 is fixed, 
  // we can move the initialSession into the session `value` function and
  // replace the `.initialSession` stream with the setStream.
  initialSession: {
    value () {
      Session.get().then(session => {
        this.initialSession = session;
      })
      .catch(err => console.log(err));
    }
  },

  /**
   * Use Session.get() to see if there's a valid JWT. If one exists, 
   * a new Session will be created.
   */
  session: {
    // value () {},
    stream () {
      return canStream.toStream(Session, 'created')
        .merge(canStream.toStream(Session, 'destroyed'))
        .map(event => event.type !== 'destroyed' ? event.args[0] : undefined)
        .merge(this.stream('.initialSession'));
    }
  },

  /**
   * Determines which page-level component is displayed.
   */
  page: {
    serialize: true,
    stream (setStream) {
      return setStream.combine(this.stream('.session'), (page, session) => {
        if (session) {
          if (page === 'home') {
            page = 'dashboard';
          } 
        } else {
          if (pages[page] === 'private') {
            page = 'home';
          }
        }
        if (!pages[page]) {
          page = 'four-oh-four';
        }
        return page;
      });
    }
  },

  /**
   * The `title` attribute is used in index.stache as the HTML title.
   */
  title: {
    value: 'Bitcentive'
  }
});

route('{page}', {page: 'home'});

export default AppViewModel;

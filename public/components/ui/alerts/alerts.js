import Kefir from 'kefir';
import canStream from 'can-stream-kefir';
import canDefineStreamKefir from 'can-define-stream-kefir';
import Component from 'can-component';
import DefineMap from 'can-define/map/';
import view from './alerts.stache';
import hub from '~/lib/event-hub';
import CID from 'can-cid';

const hubStream = canStream.toStream(hub, 'alert').map(ev => {
  return Object.assign({
    id: CID(ev),
    kind: 'warning'
  }, ev);
});

const ViewModel = DefineMap.extend({
  autoHideStream: {
    default() {
      return hubStream.flatMap(alert => {
        // Allows displayInterval to be falsy OR Infinity to disable autohide
        if (alert.displayInterval > 0 && alert.displayInterval !== Infinity) {
          return Kefir.later(alert.displayInterval, {
            type: 'remove',
            id: alert.id
          });
        }
        return Kefir.constant({ type: 'no-op' });
      });
    }
  },
  alerts: {
    stream() {
      return hubStream
        .merge(this.autoHideStream)
        .merge(this.stream('remove'))
        .scan((alerts, ev) => {
            console.log("GOt event", ev.type);
          switch (ev.type) {
            case 'alert':
              return [ev, ...alerts.slice()];

            case 'remove':
              return alerts.filter(item => item.id !== ev.id);

            default:
              return alerts;
          }
        }, []);
    }
  },
  removeAlert (alert) {
    this.dispatch({ type: 'remove', id: alert.id });
  }
});
canDefineStreamKefir(ViewModel);

export { ViewModel, hubStream };
export default Component.extend({
  tag: 'bit-alerts',
  ViewModel,
  view
});

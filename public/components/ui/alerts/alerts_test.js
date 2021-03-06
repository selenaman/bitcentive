import QUnit from 'steal-qunit';
import { ViewModel, hubStream } from './alerts';
import hub from 'bitcentive/lib/event-hub';

function hubStreamHandler(){

}

// ViewModel unit tests
QUnit.module('bitcentive/components/ui/alerts',{
	setup(){
		hubStream.onValue(hubStreamHandler);
	},
	teardown(){
		hubStream.offValue(hubStreamHandler);
	}
});

QUnit.test('Hub alerts are added and removed', assert => {
	const done = assert.async();
	const vm = new ViewModel();

	// Always unbind
	const addHandler = (ev, alerts) => {
		assert.equal(alerts.length, 1);
		assert.ok(alerts[0].hasOwnProperty('id'));
		assert.ok(alerts[0].hasOwnProperty('kind'));
		vm.off('alerts', addHandler);
		vm.on('alerts', removeHandler);
		vm.dispatch({type: 'remove', id: alerts[0].id});
	};

	const removeHandler = (ev, alerts) => {
		assert.equal(alerts.length, 0, 'Alerts should be empty');
		vm.off('alerts', removeHandler);
		done();
	};

	vm.on('alerts', addHandler);
	hub.dispatch({type: 'alert'});
});

QUnit.test('Autohide automatically creates a remove action', assert => {
	const done = assert.async();
	const vm = new ViewModel();

	// Always unbind
	const handler = ev => {
		assert.equal(ev.type, 'remove');
		vm.autoHideStream.offValue(handler);
		done();
	};

	vm.autoHideStream.onValue(handler);
	hub.dispatch({ type: 'alert', displayInterval: 100 });
});

QUnit.test('Autohide ignores falsy or Infinity', assert => {
	assert.expect(5);
	const done = assert.async();
	const vm = new ViewModel();

	const handler = ev => {
		assert.equal(ev.type, 'no-op');
	};

	// Always unbind
	setTimeout(() => {
		vm.autoHideStream.offValue(handler);
		done();
	}, 300);

	vm.autoHideStream.onValue(handler);
	hub.dispatch({ type: 'alert', displayInterval: 0 });
	hub.dispatch({ type: 'alert', displayInterval: null });
	hub.dispatch({ type: 'alert', displayInterval: undefined });
	hub.dispatch({ type: 'alert', displayInterval: '' });
	hub.dispatch({ type: 'alert', displayInterval: Infinity });
});

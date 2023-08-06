import { Args } from "grimoire-kolmafia";
import { myId } from 'kolmafia'

import {
	announceStart,
  processInbox,
} from './tasks'

const config = Args.create(
	'tlf',
	'For running various administrative tasks related to The Loathing Foundation',
	{
		'kickoff': Args.flag({
			help: 'Invoke the kmail announcing the raffle instructions for the month.',
			setting: '',
		}),
		'processInbox': Args.flag({
			help: 'Process kmails for the current month.',
			setting: '',
		}),
		'forRealsies': Args.flag({
			help: 'Actually send kmails / save results.',
			setting: '',
		}),
		'debug': Args.flag({
			help: 'Output more (and prevent sending kmails / saving results).  This overrides the forRealsies flag.',
			setting: '',
		}),
	},
)

export default function main(command = "help"): void {
  if (myId() !== '3580284') { // TheLoathingFoundation (#3580284)
    console.log('You tried to run this on the wrong account!  Should be TheLoathingFoundation (#3580284).')
    return;
  }

  Args.fill(config, command);
  if (config.help) {
    Args.showHelp(config);
    return;
  }

	if (config.kickoff) {
		announceStart(config.forRealsies, config.debug);
		return;
	}

	if (config.processInbox) {
		processInbox(config.forRealsies, config.debug);
		return;
	}
}

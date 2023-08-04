import { Args } from "grimoire-kolmafia";

import {
	announceStart,
} from './tasks'


const config = Args.create(
	'tlf',
	'For running various administrative tasks related to The Loathing Foundation',
	{
		'kickoff': Args.flag({
			help: 'Invoke the kmail announcing the raffle instructions for the month.',
			setting: '',
		}),
		'send': Args.flag({
			help: 'Actually send kmails.',
			setting: '',
		}),
	},
)

export default function main(command = "help"): void {

  Args.fill(config, command);
  if (config.help) {
    Args.showHelp(config);
    return;
  }

	if (config.kickoff) {
		announceStart(config.send);
		return;
	}
}

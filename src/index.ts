import * as asciichart from 'asciichart'
import * as child_process from 'child_process'
import { from } from "linq-to-typescript"
import { parseArgs, ParseArgsConfig } from 'node:util';

const args = process.argv;

if (args.length === 2) {
    console.log(`Syntax:`)
    console.log(`  ${args[0]} ${args[1]} [device]`)
    process.exit(1)
}

let data_read: number[] = []
let data_write: number[] = []

const devname = from(args[2].split('/')).last()

const p = child_process.spawn(
    "iostat",
    [
        "-m",
        `${args[2]}`,
        "-d",
        "1"
    ],
    {
        env: {
            LC_NUMERIC: 'en'
        }
    })

p.stdout.on('data', data => {
    const lines = String(data).split('\n')

    const q = from(lines).firstOrDefault(w => w.startsWith(devname))

    if (q) {
        const ss = from(q.split(' ')).where(r => r.trim().length > 0).toArray()
        if (ss.length === 8) {

            const read_mb_s = parseFloat(ss[2])
            const write_mb_s = parseFloat(ss[3])

            data_read.push(read_mb_s)
            data_write.push(write_mb_s)

            if (data_read.length > 2) {
                console.clear()
                console.log(`device ${args[2]} (mb/s)`)
                console.log()
                console.log(asciichart.plot([data_read, data_write], {
                    height: 10,
                    colors: [
                        asciichart.green,
                        asciichart.red
                    ]
                }))
            }

            const W = process.stdout.columns - 15

            if (data_read.length > W) {
                data_read.splice(0, data_read.length - W)
                data_write.splice(0, data_write.length - W)
            }

        }
    }
})


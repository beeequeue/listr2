import delay = require('delay')

import { Listr } from '@root/index'

describe('skip a task', () => {
  let log: jest.SpyInstance<void, string[][]>
  let info: jest.SpyInstance<void, string[][]>

  beforeEach(async () => {
    log = jest.spyOn(console, 'log').mockImplementation()
    info = jest.spyOn(console, 'info').mockImplementation()
  })

  afterEach(async () => {
    jest.clearAllMocks()
  })

  it('should skip the task from internal call', async () => {
    await new Listr(
      [
        {
          task: async (ctx, task): Promise<void> => {
            task.skip('skipped')
          }
        }
      ],
      { renderer: 'verbose' }
    ).run()

    expect(log).toBeCalledWith('[STARTED] Task without title.')
    expect(info).toBeCalledWith('[SKIPPED] skipped')
  })

  it('should skip the task from skip method', async () => {
    await new Listr(
      [
        {
          skip (): string {
            return 'skipped'
          },
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          task: async (): Promise<void> => {}
        }
      ],
      { renderer: 'verbose' }
    ).run()

    expect(log).toBeCalledWith('[STARTED] Task without title.')
    expect(info).toBeCalledWith('[SKIPPED] skipped')
  })

  it('skip to enable by context will work properly in serial', async () => {
    await new Listr(
      [
        {
          task: async (ctx, task): Promise<void> => {
            ctx.test = true
            task.skip('skipped')
          }
        },
        {
          enabled: (ctx): boolean => ctx.test,
          task: async (ctx, task): Promise<void> => {
            task.output = 'enabled'
          }
        }
      ],
      { renderer: 'verbose', concurrent: false }
    ).run()

    expect(log).toBeCalledWith('[STARTED] Task without title.')
    expect(info).toBeCalledWith('[SKIPPED] skipped')
    expect(info).toBeCalledWith('[DATA] enabled')
  })

  it('skip to enable by context will not work properly in concurrent', async () => {
    await new Listr(
      [
        {
          task: async (ctx, task): Promise<void> => {
            ctx.test = true
            task.skip('skipped')
          }
        },
        {
          enabled: (ctx): boolean => ctx.test,
          task: async (ctx, task): Promise<void> => {
            task.output = 'enabled'
          }
        }
      ],
      { renderer: 'verbose', concurrent: true }
    ).run()

    expect(log).toBeCalledWith('[STARTED] Task without title.')
    expect(info).toBeCalledWith('[SKIPPED] skipped')
    expect(info).not.toBeCalledWith('[DATA] enabled')
  })

  it.each<[boolean | string, string]>([
    [ true, 'Skipped task without a title.' ],
    [ 'skipped', 'skipped' ]
  ])('should skip the task from async skip method returning either boolean or string', async (skip, expected) => {
    await new Listr(
      [
        {
          skip: async (): Promise<boolean | string> => {
            await delay(20)

            return skip
          },
          task: async (_, task): Promise<void> => {
            task.output = 'This will never execute.'
          }
        }
      ],
      { renderer: 'verbose' }
    ).run()

    expect(log).toBeCalledWith('[STARTED] Task without title.')
    expect(info).toBeCalledWith('[SKIPPED] ' + expected)
  })
})

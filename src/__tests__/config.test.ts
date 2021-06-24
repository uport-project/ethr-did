import { EthrDID } from '..'

describe('configuration', () => {
  it('can use rpcUrl - github #64', () => {
    const ethrDid = new EthrDID({
      identifier: '0xC662e6c5F91B9FcD22D7FcafC80Cf8b640aed247',
      rpcUrl: 'http://localhost:9585',
      chainNameOrId: 1337,
    })
    expect(ethrDid).toBeDefined()
  })
})

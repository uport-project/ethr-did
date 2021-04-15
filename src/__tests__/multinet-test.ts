import { EthrDID } from '..'

describe('other networks', () => {
  it('rsk - github #50', () => {
    const ethrDid = new EthrDID({
      identifier: '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
      chainNameOrId: 'rsk',
    })
    expect(ethrDid.did).toEqual('did:ethr:rsk:0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71')
    expect(ethrDid.address).toEqual('0xC662e6c5F91B9FcD22D7FcafC80Cf8b640aed247')
  })
})

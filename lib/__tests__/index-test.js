'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _didResolver = require('did-resolver');

var _didResolver2 = _interopRequireDefault(_didResolver);

var _ethrDidResolver = require('ethr-did-resolver');

var _ethrDidResolver2 = _interopRequireDefault(_ethrDidResolver);

var _index = require('../index.js');

var _index2 = _interopRequireDefault(_index);

var _truffleContract = require('truffle-contract');

var _truffleContract2 = _interopRequireDefault(_truffleContract);

var _ethrDidRegistry = require('ethr-did-registry');

var _ethrDidRegistry2 = _interopRequireDefault(_ethrDidRegistry);

var _web = require('web3');

var _web2 = _interopRequireDefault(_web);

var _ganacheCli = require('ganache-cli');

var _ganacheCli2 = _interopRequireDefault(_ganacheCli);

var _didJwt = require('did-jwt');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Secp256k1SignatureAuthentication2018 = _ethrDidResolver.delegateTypes.Secp256k1SignatureAuthentication2018;


function sleep(seconds) {
  return new _promise2.default(function (resolve) {
    return setTimeout(resolve, seconds * 1000);
  });
}

describe('EthrDID', function () {
  var provider = _ganacheCli2.default.provider();
  var DidReg = (0, _truffleContract2.default)(_ethrDidRegistry2.default);
  var web3 = new _web2.default();
  web3.setProvider(provider);
  var getAccounts = function getAccounts() {
    return new _promise2.default(function (resolve, reject) {
      return web3.eth.getAccounts(function (error, accounts) {
        return error ? reject(error) : resolve(accounts);
      });
    });
  };
  DidReg.setProvider(provider);

  var ethrDid = void 0,
      plainDid = void 0,
      registry = void 0,
      accounts = void 0,
      did = void 0,
      identity = void 0,
      owner = void 0,
      delegate1 = void 0,
      delegate2 = void 0;

  beforeAll((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return getAccounts();

          case 2:
            accounts = _context.sent;

            identity = accounts[1].toLowerCase();
            owner = accounts[2].toLowerCase();
            delegate1 = accounts[3].toLowerCase();
            delegate2 = accounts[4].toLowerCase();
            did = 'did:ethr:' + identity;

            _context.next = 10;
            return DidReg.new({
              from: accounts[0],
              gasPrice: 100000000000,
              gas: 4712388
            });

          case 10:
            registry = _context.sent;

            ethrDid = new _index2.default({ provider: provider, registry: registry.address, address: identity });
            (0, _ethrDidResolver2.default)({ provider: provider, registry: registry.address });

          case 13:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));

  describe('presets', function () {
    it('sets address', function () {
      expect(ethrDid.address).toEqual(identity);
    });

    it('sets did', function () {
      expect(ethrDid.did).toEqual(did);
    });
  });

  it('defaults owner to itself', function () {
    return expect(ethrDid.lookupOwner()).resolves.toEqual(identity);
  });

  describe('key management', function () {
    describe('owner changed', function () {
      beforeAll((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return ethrDid.changeOwner(owner);

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, undefined);
      })));

      it('changes owner', function () {
        return expect(ethrDid.lookupOwner()).resolves.toEqual(owner);
      });

      it('resolves document', function () {
        return expect((0, _didResolver2.default)(did)).resolves.toEqual({
          '@context': 'https://w3id.org/did/v1',
          id: did,
          publicKey: [{
            id: did + '#owner',
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: owner
          }],
          authentication: [{
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: did + '#owner'
          }]
        });
      });
    });

    describe('delegates', function () {
      describe('add signing delegate', function () {
        beforeAll((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
          return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.next = 2;
                  return ethrDid.addDelegate(delegate1, { expiresIn: 2 });

                case 2:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, undefined);
        })));

        it('resolves document', function () {
          return expect((0, _didResolver2.default)(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [{
              id: did + '#owner',
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: owner
            }, {
              id: did + '#delegate-1',
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: delegate1
            }],
            authentication: [{
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: did + '#owner'
            }]
          });
        });
      });

      describe('add auth delegate', function () {
        beforeAll((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
          return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.next = 2;
                  return ethrDid.addDelegate(delegate2, { delegateType: Secp256k1SignatureAuthentication2018, expiresIn: 10 });

                case 2:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, undefined);
        })));

        it('resolves document', function () {
          return expect((0, _didResolver2.default)(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [{
              id: did + '#owner',
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: owner
            }, {
              id: did + '#delegate-1',
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: delegate1
            }, {
              id: did + '#delegate-2',
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: delegate2
            }],
            authentication: [{
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: did + '#owner'
            }, {
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: did + '#delegate-2'
            }]
          });
        });
      });

      describe('expire automatically', function () {
        beforeAll((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
          return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.next = 2;
                  return sleep(3);

                case 2:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, undefined);
        })));

        it('resolves document', function () {
          return expect((0, _didResolver2.default)(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [{
              id: did + '#owner',
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: owner
            }, {
              id: did + '#delegate-1',
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: delegate2
            }],
            authentication: [{
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: did + '#owner'
            }, {
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: did + '#delegate-1'
            }]
          });
        });
      });

      describe('revokes delegate', function () {
        beforeAll((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
          return _regenerator2.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.next = 2;
                  return ethrDid.revokeDelegate(delegate2, Secp256k1SignatureAuthentication2018);

                case 2:
                  _context6.next = 4;
                  return sleep(1);

                case 4:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6, undefined);
        })));

        it('resolves document', function () {
          return expect((0, _didResolver2.default)(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [{
              id: did + '#owner',
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: owner
            }],
            authentication: [{
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: did + '#owner'
            }]
          });
        });
      });

      describe('re-add auth delegate', function () {
        beforeAll((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
          return _regenerator2.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.next = 2;
                  return ethrDid.addDelegate(delegate2, { delegateType: Secp256k1SignatureAuthentication2018 });

                case 2:
                case 'end':
                  return _context7.stop();
              }
            }
          }, _callee7, undefined);
        })));

        it('resolves document', function () {
          return expect((0, _didResolver2.default)(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [{
              id: did + '#owner',
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: owner
            }, {
              id: did + '#delegate-1',
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: delegate2
            }],
            authentication: [{
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: did + '#owner'
            }, {
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: did + '#delegate-1'
            }]
          });
        });
      });
    });

    describe('attributes', function () {
      describe('publicKey', function () {
        describe('Secp256k1VerificationKey2018', function () {
          beforeAll((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8() {
            return _regenerator2.default.wrap(function _callee8$(_context8) {
              while (1) {
                switch (_context8.prev = _context8.next) {
                  case 0:
                    _context8.next = 2;
                    return ethrDid.setAttribute('did/pub/Secp256k1/veriKey', '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71', 10);

                  case 2:
                  case 'end':
                    return _context8.stop();
                }
              }
            }, _callee8, undefined);
          })));

          it('resolves document', function () {
            return expect((0, _didResolver2.default)(did)).resolves.toEqual({
              '@context': 'https://w3id.org/did/v1',
              id: did,
              publicKey: [{
                id: did + '#owner',
                type: 'Secp256k1VerificationKey2018',
                owner: did,
                ethereumAddress: owner
              }, {
                id: did + '#delegate-1',
                type: 'Secp256k1VerificationKey2018',
                owner: did,
                ethereumAddress: delegate2
              }, {
                id: did + '#delegate-2',
                type: 'Secp256k1VerificationKey2018',
                owner: did,
                publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
              }],
              authentication: [{
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: did + '#owner'
              }, {
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: did + '#delegate-1'
              }]
            });
          });
        });

        describe('Base64 Encoded Key', function () {
          beforeAll((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9() {
            return _regenerator2.default.wrap(function _callee9$(_context9) {
              while (1) {
                switch (_context9.prev = _context9.next) {
                  case 0:
                    _context9.next = 2;
                    return ethrDid.setAttribute('did/pub/Ed25519/veriKey/base64', 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx', 10);

                  case 2:
                  case 'end':
                    return _context9.stop();
                }
              }
            }, _callee9, undefined);
          })));

          it('resolves document', function () {
            return expect((0, _didResolver2.default)(did)).resolves.toEqual({
              '@context': 'https://w3id.org/did/v1',
              id: did,
              publicKey: [{
                id: did + '#owner',
                type: 'Secp256k1VerificationKey2018',
                owner: did,
                ethereumAddress: owner
              }, {
                id: did + '#delegate-1',
                type: 'Secp256k1VerificationKey2018',
                owner: did,
                ethereumAddress: delegate2
              }, {
                id: did + '#delegate-2',
                type: 'Secp256k1VerificationKey2018',
                owner: did,
                publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
              }, {
                id: did + '#delegate-3',
                type: 'Ed25519VerificationKey2018',
                owner: did,
                publicKeyBase64: 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx'
              }],
              authentication: [{
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: did + '#owner'
              }, {
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: did + '#delegate-1'
              }]
            });
          });
        });

        describe('Use Buffer', function () {
          beforeAll((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee10() {
            return _regenerator2.default.wrap(function _callee10$(_context10) {
              while (1) {
                switch (_context10.prev = _context10.next) {
                  case 0:
                    _context10.next = 2;
                    return ethrDid.setAttribute('did/pub/Ed25519/veriKey/base64', Buffer.from('f2b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b72', 'hex'), 10);

                  case 2:
                  case 'end':
                    return _context10.stop();
                }
              }
            }, _callee10, undefined);
          })));

          it('resolves document', function () {
            return expect((0, _didResolver2.default)(did)).resolves.toEqual({
              '@context': 'https://w3id.org/did/v1',
              id: did,
              publicKey: [{
                id: did + '#owner',
                type: 'Secp256k1VerificationKey2018',
                owner: did,
                ethereumAddress: owner
              }, {
                id: did + '#delegate-1',
                type: 'Secp256k1VerificationKey2018',
                owner: did,
                ethereumAddress: delegate2
              }, {
                id: did + '#delegate-2',
                type: 'Secp256k1VerificationKey2018',
                owner: did,
                publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
              }, {
                id: did + '#delegate-3',
                type: 'Ed25519VerificationKey2018',
                owner: did,
                publicKeyBase64: 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx'
              }, {
                id: did + '#delegate-4',
                type: 'Ed25519VerificationKey2018',
                owner: did,
                publicKeyBase64: '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty'
              }],
              authentication: [{
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: did + '#owner'
              }, {
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: did + '#delegate-1'
              }]
            });
          });
        });
      });

      describe('service endpoints', function () {
        describe('HubService', function () {
          beforeAll((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee11() {
            return _regenerator2.default.wrap(function _callee11$(_context11) {
              while (1) {
                switch (_context11.prev = _context11.next) {
                  case 0:
                    _context11.next = 2;
                    return ethrDid.setAttribute('did/svc/HubService', 'https://hubs.uport.me', 10);

                  case 2:
                  case 'end':
                    return _context11.stop();
                }
              }
            }, _callee11, undefined);
          })));
          it('resolves document', function () {
            return expect((0, _didResolver2.default)(did)).resolves.toEqual({
              '@context': 'https://w3id.org/did/v1',
              id: did,
              publicKey: [{
                id: did + '#owner',
                type: 'Secp256k1VerificationKey2018',
                owner: did,
                ethereumAddress: owner
              }, {
                id: did + '#delegate-1',
                type: 'Secp256k1VerificationKey2018',
                owner: did,
                ethereumAddress: delegate2
              }, {
                id: did + '#delegate-2',
                type: 'Secp256k1VerificationKey2018',
                owner: did,
                publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
              }, {
                id: did + '#delegate-3',
                type: 'Ed25519VerificationKey2018',
                owner: did,
                publicKeyBase64: Buffer.from('02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71', 'hex').toString('base64')
              }, {
                id: did + '#delegate-4',
                type: 'Ed25519VerificationKey2018',
                owner: did,
                publicKeyBase64: '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty'
              }],
              authentication: [{
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: did + '#owner'
              }, {
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: did + '#delegate-1'
              }],
              service: [{
                type: 'HubService',
                serviceEndpoint: 'https://hubs.uport.me'
              }]
            });
          });
        });
      });
    });
  });

  describe('signJWT', function () {
    describe('No signer configured', function () {
      it('should fail', function () {
        return expect(ethrDid.signJWT({ hello: 'world' })).rejects.toEqual(new Error('No signer configured'));
      });
    });

    describe('creating a signing Delegate', function () {
      var kp = void 0;
      beforeAll((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee12() {
        return _regenerator2.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return ethrDid.createSigningDelegate();

              case 2:
                kp = _context12.sent.kp;

              case 3:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, undefined);
      })));

      it('resolves document', function () {
        return expect((0, _didResolver2.default)(did)).resolves.toEqual({
          '@context': 'https://w3id.org/did/v1',
          id: did,
          publicKey: [{
            id: did + '#owner',
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: owner
          }, {
            id: did + '#delegate-1',
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: delegate2
          }, {
            id: did + '#delegate-2',
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
          }, {
            id: did + '#delegate-3',
            type: 'Ed25519VerificationKey2018',
            owner: did,
            publicKeyBase64: Buffer.from('02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71', 'hex').toString('base64')
          }, {
            id: did + '#delegate-4',
            type: 'Ed25519VerificationKey2018',
            owner: did,
            publicKeyBase64: '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty'
          }, {
            id: did + '#delegate-5',
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: kp.address
          }],
          authentication: [{
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: did + '#owner'
          }, {
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: did + '#delegate-1'
          }],
          service: [{
            type: 'HubService',
            serviceEndpoint: 'https://hubs.uport.me'
          }]
        });
      });

      it('should sign valid jwt', function () {
        return ethrDid.signJWT({ hello: 'world' }).then(function (jwt) {
          return (0, _didJwt.verifyJWT)(jwt).then(function (_ref13) {
            var payload = _ref13.payload,
                signer = _ref13.signer;
            return expect(signer).toEqual({
              id: did + '#delegate-5',
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: kp.address
            });
          }, function (error) {
            return expect(error).toBeNull();
          });
        });
      });
    });

    describe('plain vanilla keypair account', function () {
      it('should sign valid jwt', function () {
        var kp = _index2.default.createKeyPair();
        plainDid = new _index2.default((0, _extends3.default)({}, kp, { provider: provider, registry: registry.address }));
        plainDid.signJWT({ hello: 'world' }).then(function (jwt) {
          return (0, _didJwt.verifyJWT)(jwt).then(function (_ref14) {
            var payload = _ref14.payload;
            return expect(payload).toBeDefined();
          }, function (error) {
            return expect(error).toBeNull();
          });
        });
      });
    });
  });

  describe('verifyJWT', function () {
    it('verifies the signature of the JWT', function () {
      return ethrDid.signJWT({ hello: 'friend' }).then(function (jwt) {
        return plainDid.verifyJWT(jwt);
      }).then(function (_ref15) {
        var issuer = _ref15.issuer;
        return expect(issuer).toEqual(did);
      });
    });

    describe('uses did for verifying aud claim', function () {
      it('verifies the signature of the JWT', function () {
        return ethrDid.signJWT({ hello: 'friend', aud: plainDid.did }).then(function (jwt) {
          return plainDid.verifyJWT(jwt);
        }).then(function (_ref16) {
          var issuer = _ref16.issuer;
          return expect(issuer).toEqual(did);
        });
      });

      it('fails if wrong did', function () {
        return ethrDid.signJWT({ hello: 'friend', aud: ethrDid.did }).then(function (jwt) {
          return plainDid.verifyJWT(jwt);
        }).catch(function (error) {
          return expect(error.message).toEqual('JWT audience does not match your DID: aud: ' + ethrDid.did + ' !== yours: ' + plainDid.did);
        });
      });
    });
  });
});
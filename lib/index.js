'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

exports.createKeyPair = createKeyPair;

var _ethjsProviderHttp = require('ethjs-provider-http');

var _ethjsProviderHttp2 = _interopRequireDefault(_ethjsProviderHttp);

var _ethjsQuery = require('ethjs-query');

var _ethjsQuery2 = _interopRequireDefault(_ethjsQuery);

var _ethjsContract = require('ethjs-contract');

var _ethjsContract2 = _interopRequireDefault(_ethjsContract);

var _ethrDidRegistry = require('ethr-did-resolver/contracts/ethr-did-registry.json');

var _ethrDidRegistry2 = _interopRequireDefault(_ethrDidRegistry);

var _didJwt = require('did-jwt');

var _elliptic = require('elliptic');

var _Digest = require('did-jwt/lib/Digest');

var _buffer = require('buffer');

var _ethrDidResolver = require('ethr-did-resolver');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var secp256k1 = new _elliptic.ec('secp256k1');
var Secp256k1VerificationKey2018 = _ethrDidResolver.delegateTypes.Secp256k1VerificationKey2018;


function configureProvider() {
  var conf = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (conf.provider) {
    return conf.provider;
  } else if (conf.web3) {
    return conf.web3.currentProvider;
  } else {
    return new _ethjsProviderHttp2.default(conf.rpcUrl || 'https://mainnet.infura.io/ethr-did');
  }
}

function attributeToHex(key, value) {
  if (_buffer.Buffer.isBuffer(value)) {
    return '0x' + value.toString('hex');
  }
  var match = key.match(/^did\/(pub|auth|svc)\/(\w+)(\/(\w+))?(\/(\w+))?$/);
  if (match) {
    var encoding = match[6];
    // TODO add support for base58
    if (encoding === 'base64') {
      return '0x' + _buffer.Buffer.from(value, 'base64').toString('hex');
    }
  }
  if (value.match(/^0x[0-9a-fA-F]*$/)) {
    return value;
  }
  return '0x' + _buffer.Buffer.from(value).toString('hex');
}

function createKeyPair() {
  var kp = secp256k1.genKeyPair();
  var publicKey = kp.getPublic('hex');
  var privateKey = kp.getPrivate('hex');
  var address = (0, _Digest.toEthereumAddress)(publicKey);
  return { address: address, privateKey: privateKey };
}

var EthrDID = function () {
  function EthrDID() {
    var conf = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, EthrDID);

    var provider = configureProvider(conf);
    var eth = new _ethjsQuery2.default(provider);
    var registryAddress = conf.registry || _ethrDidResolver.REGISTRY;
    var DidReg = new _ethjsContract2.default(eth)(_ethrDidRegistry2.default);
    this.registry = DidReg.at(registryAddress);
    this.address = conf.address;
    if (!this.address) throw new Error('No address is set for EthrDid');
    this.did = 'did:ethr:' + this.address;
    if (conf.signer) {
      this.signer = conf.signer;
    } else if (conf.privateKey) {
      this.signer = (0, _didJwt.SimpleSigner)(conf.privateKey);
    }
  }

  (0, _createClass3.default)(EthrDID, [{
    key: 'lookupOwner',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        var cache = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
        var result;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(cache && this.owner)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return', this.owner);

              case 2:
                _context.next = 4;
                return this.registry.identityOwner(this.address);

              case 4:
                result = _context.sent;
                return _context.abrupt('return', result['0']);

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function lookupOwner() {
        return _ref.apply(this, arguments);
      }

      return lookupOwner;
    }()
  }, {
    key: 'changeOwner',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(newOwner) {
        var owner, txHash;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.lookupOwner();

              case 2:
                owner = _context2.sent;
                _context2.next = 5;
                return this.registry.changeOwner(this.address, newOwner, { from: owner });

              case 5:
                txHash = _context2.sent;

                this.owner = newOwner;
                return _context2.abrupt('return', txHash);

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function changeOwner(_x4) {
        return _ref2.apply(this, arguments);
      }

      return changeOwner;
    }()
  }, {
    key: 'addDelegate',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(delegate) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var delegateType, expiresIn, owner;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                delegateType = options.delegateType || Secp256k1VerificationKey2018;
                expiresIn = options.expiresIn || 86400;
                _context3.next = 4;
                return this.lookupOwner();

              case 4:
                owner = _context3.sent;
                return _context3.abrupt('return', this.registry.addDelegate(this.address, delegateType, delegate, expiresIn, { from: owner }));

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function addDelegate(_x6) {
        return _ref3.apply(this, arguments);
      }

      return addDelegate;
    }()
  }, {
    key: 'revokeDelegate',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(delegate) {
        var delegateType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Secp256k1VerificationKey2018;
        var owner;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.lookupOwner();

              case 2:
                owner = _context4.sent;
                return _context4.abrupt('return', this.registry.revokeDelegate(this.address, delegateType, delegate, { from: owner }));

              case 4:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function revokeDelegate(_x8) {
        return _ref4.apply(this, arguments);
      }

      return revokeDelegate;
    }()
  }, {
    key: 'setAttribute',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(key, value) {
        var expiresIn = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 86400;
        var owner;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this.lookupOwner();

              case 2:
                owner = _context5.sent;
                return _context5.abrupt('return', this.registry.setAttribute(this.address, (0, _ethrDidResolver.stringToBytes32)(key), attributeToHex(key, value), expiresIn, { from: owner }));

              case 4:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function setAttribute(_x10, _x11) {
        return _ref5.apply(this, arguments);
      }

      return setAttribute;
    }()
  }, {
    key: 'revokeAttribute',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(key, value) {
        var owner;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this.lookupOwner();

              case 2:
                owner = _context6.sent;
                return _context6.abrupt('return', this.registry.revokeAttribute(this.address, (0, _ethrDidResolver.stringToBytes32)(key), attributeToHex(key, value), { from: owner }));

              case 4:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function revokeAttribute(_x12, _x13) {
        return _ref6.apply(this, arguments);
      }

      return revokeAttribute;
    }()

    // Create a temporary signing delegate able to sign JWT on behalf of identity

  }, {
    key: 'createSigningDelegate',
    value: function () {
      var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
        var delegateType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Secp256k1VerificationKey2018;
        var expiresIn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 86400;
        var kp, txHash;
        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                kp = createKeyPair();

                this.signer = (0, _didJwt.SimpleSigner)(kp.privateKey);
                _context7.next = 4;
                return this.addDelegate(kp.address, { delegateType: delegateType, expiresIn: expiresIn });

              case 4:
                txHash = _context7.sent;
                return _context7.abrupt('return', { kp: kp, txHash: txHash });

              case 6:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function createSigningDelegate() {
        return _ref7.apply(this, arguments);
      }

      return createSigningDelegate;
    }()
  }, {
    key: 'signJWT',
    value: function () {
      var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(payload, expiresIn) {
        var options;
        return _regenerator2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                if (!(typeof this.signer !== 'function')) {
                  _context8.next = 2;
                  break;
                }

                throw new Error('No signer configured');

              case 2:
                options = { signer: this.signer, alg: 'ES256K-R', issuer: this.did };

                if (expiresIn) options.expiresIn = expiresIn;
                return _context8.abrupt('return', (0, _didJwt.createJWT)(payload, options));

              case 5:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function signJWT(_x16, _x17) {
        return _ref8.apply(this, arguments);
      }

      return signJWT;
    }()
  }, {
    key: 'verifyJWT',
    value: function () {
      var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9(jwt) {
        var audience = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.did;
        return _regenerator2.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                return _context9.abrupt('return', (0, _didJwt.verifyJWT)(jwt, { audience: audience }));

              case 1:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function verifyJWT(_x19) {
        return _ref9.apply(this, arguments);
      }

      return verifyJWT;
    }()
  }]);
  return EthrDID;
}();

EthrDID.createKeyPair = createKeyPair;
module.exports = EthrDID;
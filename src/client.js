const request = require('request')
const cheerio = require('cheerio')
const logger = require('./logger')

class client {
    constructor(config) {
        // init private vars
        this._config = config
        this._jar = request.jar()
        this._headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest'
        }
        this._logger = new logger()
    }

    async buy(variant) {
        try {
            let product = await this.addToCart(variant)
            this._logger.success(`Successfully added ${product} to cart.`)
            await this.login()
            this._logger.success(`Successfully logged in.`)
            let shippingMethod = await this.postAddress()
            this._logger.success(`Successfully posted shipping & billing information.`)
            await this.postShippingMethod(shippingMethod)
            this._logger.success(`Successfully posted shipping method.`)
        } catch(e) {
            this._logger.failure(e)
        }
    }

    async addToCart(variant) {
        let options = {
            url: 'https://www.bstn.com/cart/add',
            method: 'post',
            jar: this._jar,
            headers: this._headers,
            form: {
                'product_id': variant,
                'product_bs_id': '',
                'amount': '1',
                'addToCart': '',
                'ajax': 'true'
            },
            followRedirect: false,
            gzip: true
        }

        let response = await this.buildRequest(options)

        if(response.status != 200) {
            throw `Failure adding to cart. Status code ${response.status}.`
        }

        let $ = cheerio.load(response.body)

        let productName = $('.twelve.columns p').text().split('Artikel')[1].split('(')[0].trim()

        return productName
    }

    async login() {
        let options = {
            url: 'https://www.bstn.com/einloggen',
            method: 'post',
            jar: this._jar,
            headers: this._headers,
            followRedirect: false,
            form: {
                'login[email]': this._config.email,
                'login[password]': this._config.password
            },
            gzip: true
        }

        let response = await this.buildRequest(options)
    }

    async postAddress() {
        let options = {
            url: 'https://www.bstn.com/cart/address',
            method: 'post',
            jar: this._jar,
            headers: this._headers,
            form: {
                'billAddressId': '-1',
                'billaddress[salutation]': '1',
                'billaddress[forename]': this._config.firstName,
                'billaddress[lastname]': this._config.lastName,
                'billaddress[street]': this._config.street,
                'billaddress[street_number]': this._config.streetNum,
                'billaddress[addition]': '',
                'billaddress[zipcode]': this._config.zip,
                'billaddress[city]': this._config.city,
                'billaddress[country]': '34',
                'billaddress[phone]': this._config.phone,
                'shippingAddressId': '-1',
                'shippingaddress[salutation]': '',
                'shippingaddress[forename]': '',
                'shippingaddress[lastname]': '',
                'shippingaddress[street]': '',
                'shippingaddress[street_number]': '',
                'shippingaddress[addition]': '',
                'shippingaddress[zipcode]': '',
                'shippingaddress[city]': '',
                'shippingaddress[country]': '',
                'next_x': 'to Payment & Shipping',
                'back_x_value': '@cart',
                'next_x_value': '@cart_payment'
            },
            gzip: true
        }

        let response = await this.buildRequest(options)

        if(response.url != 'https://www.bstn.com/cart/payment' || response.status != 200) {
            throw `Failure posting shipping & billing information. Status code ${response.status}.`
        }

        let $ = cheerio.load(response.body)
        
        let shippingMethod = $('[name="shipping_method_id"]').attr('value')

        let shippingMethodName = $('[name="shipping_method_id"]').attr('id')

        this._logger.success(`Obtained shipping method ${shippingMethodName}.`)

        return shippingMethod
    }

    async postShippingMethod(method) {
        let options = {
            url: 'https://www.bstn.com/cart/payment',
            method: 'post',
            jar: this._jar,
            headers: this._headers,
            form: {
                'stateId': 'xxx',
                'payment_method_id': '8',
                'shipping_method_id': method,
                'back_x_value': '@cart_address',
                'next_x': 'Continue to the order overview',
                'next_x_value': '@cart_check'
            },
            gzip: true
        }

        let response = await this.buildRequest(options)

        if(response.url != 'https://www.bstn.com/cart/check' || response.status != 200) {
            throw `Failure posting shipping method. Status code ${response.status}.`
        }
    }

    buildRequest(options) {
        if(!this._config.proxy.includes('localhost')) {
            options.proxy = this._config.proxy
        }
        return new Promise(function(resolve, reject) {
            request(options, function(err, res, body) {
                if (err) {
                    reject(err)
                }
                resolve({
                    res: res,
                    body: body,
                    status: res.statusCode,
                    url: this.uri.href
                })
            })
        })
    }
}

module.exports = client
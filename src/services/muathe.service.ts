import { env } from '@/config'
import CryptoJS from 'crypto-js'

/**
 * Enum for card status codes
 */
export enum CardStatus {
  SUCCESS = 1,
  FAILED = 0,
  PENDING = 99,
}

/**
 * Enum for card purchase error codes
 */
export enum CardPurchaseErrorCode {
  SUCCESS = 1,
  SUCCESS_FAILED_DOWNLOAD = 2,
  PRODUCT_NOT_EXIST = 100,
  WALLET_NOT_EXIST = 101,
  INSUFFICIENT_BALANCE = 102,
  NO_DATA_SENT = 103,
  INVALID_DATA = 104,
  INVALID_PRODUCT = 105,
  CARD_TYPE_UNAVAILABLE = 106,
  PURCHASE_ERROR_NO_CHARGE = 107,
  MERCHANT_ACCOUNT_NOT_EXIST = 108,
  REQUEST_ID_EXISTS = 109,
  INVALID_REQUEST = 110,
  WALLET_ADDRESS_NOT_EXIST = 111,
  WALLET_ADDRESS_INACTIVE = 112,
  ACCOUNT_LOCKED = 113,
  MERCHANT_WRONG_IP = 114,
  MERCHANT_INACTIVE = 115,
  WRONG_SIGNATURE = 116,
  MISSING_COMMAND_PARAMETER = 117,
  PRODUCT_OUT_OF_STOCK = 118,
  IP_NOT_ALLOWED = 119,
  EXCEPTION_ERROR = 120,
  PAYMENT_FAILED = 121,
  PURCHASE_FAILED = 122,
  INVALID_PRODUCT_PRICE = 123,
  ORDER_FAILED_LIMIT_REACHED = 124,
  INVALID_QUANTITY = 125,
  QUANTITY_MUST_BE_POSITIVE = 126,
}

/**
 * Interface for check availability response
 */
export interface AvailabilityResponse {
  stock_available: boolean
  message: string
}

/**
 * Interface for standardized response after processing
 */
export interface StandardResponse {
  success: boolean
  status: number
  message: string
  data: any
}

/**
 * Interface for balance response
 */
export interface BalanceResponse {
  balance: number
  currency_code: string
}

/**
 * Interface for card data in redownload response
 */
export interface CardData {
  name: string
  serial: string
  code: string
  expired: string | null
}

/**
 * Interface for redownload response
 */
export interface RedownloadResponse {
  status: number
  message: string
  data: {
    cards: CardData[]
    time: string
    request_id: string
    order_code: string
  }
}

/**
 * Interface for purchase response
 */
export interface PurchaseResponse {
  status: number
  message: string
  data: {
    cards: CardData[]
    time: string
    request_id: string
    order_code: string
  }
}

/**
 * MuaThe - A TypeScript class for integrating with card purchasing API
 * This class supports checking availability, purchasing cards, redownloading cards, and checking balance
 */
export class MuaThe {
  private partnerId: string
  private partnerKey: string
  private apiUrl: string = 'https://doithe1s.vn/api/cardws'

  /**
   * Constructor for MuaThe class
   * @param partnerId - Partner ID for the API
   * @param partnerKey - Partner key for the API
   */
  constructor(partnerId: string, partnerKey: string) {
    this.partnerId = partnerId
    this.partnerKey = partnerKey
  }

  /**
   * Generate signature using MD5
   * @param command - API command
   * @param requestId - Request ID
   * @returns MD5 hash of partnerKey + partnerId + command + requestId
   */
  private generateSignature(command: string, requestId: string): string {
    return CryptoJS.MD5(this.partnerKey + this.partnerId + command + requestId).toString()
  }

  /**
   * Process the API response and return standardized result
   * @param result - API response
   * @returns Standardized result object
   */
  private processResponse(result: any): StandardResponse {
    const response: StandardResponse = {
      success: false,
      status: result.status,
      message: result.message || '',
      data: result,
    }

    // Handle specific status codes for card purchases
    switch (result.status) {
      case CardPurchaseErrorCode.SUCCESS:
        response.success = true
        response.message = 'Mua thẻ thành công'
        break
      case CardPurchaseErrorCode.SUCCESS_FAILED_DOWNLOAD:
        response.success = true
        response.message =
          'Thanh toán thành công. Lấy thẻ thất bại, vui lòng redownload sau ít phút'
        break
      case CardPurchaseErrorCode.PRODUCT_NOT_EXIST:
        response.message = 'Sản phẩm không tồn tại'
        break
      case CardPurchaseErrorCode.WALLET_NOT_EXIST:
        response.message = 'Ví điện tử không tồn tại'
        break
      case CardPurchaseErrorCode.INSUFFICIENT_BALANCE:
        response.message = 'Số dư ví không đủ'
        break
      case CardPurchaseErrorCode.NO_DATA_SENT:
        response.message = 'Không có dữ liệu gửi lên'
        break
      case CardPurchaseErrorCode.INVALID_DATA:
        response.message = 'Dữ liệu gửi lên không đúng'
        break
      case CardPurchaseErrorCode.INVALID_PRODUCT:
        response.message = 'Sản phẩm không đúng'
        break
      case CardPurchaseErrorCode.CARD_TYPE_UNAVAILABLE:
        response.message = 'Loại thẻ đang ngừng cung cấp'
        break
      case CardPurchaseErrorCode.PURCHASE_ERROR_NO_CHARGE:
        response.message = 'Lỗi mua hàng, bạn chưa bị trừ tiền'
        break
      case CardPurchaseErrorCode.MERCHANT_ACCOUNT_NOT_EXIST:
        response.message = 'Không tồn tại tài khoản merchant'
        break
      case CardPurchaseErrorCode.REQUEST_ID_EXISTS:
        response.message = 'Mã yêu cầu request_id đã tồn tại'
        break
      case CardPurchaseErrorCode.INVALID_REQUEST:
        response.message = 'Yêu cầu không hợp lệ'
        break
      case CardPurchaseErrorCode.WALLET_ADDRESS_NOT_EXIST:
        response.message = 'Địa chỉ ví không tồn tại'
        break
      case CardPurchaseErrorCode.WALLET_ADDRESS_INACTIVE:
        response.message = 'Địa chỉ ví không hoạt động'
        break
      case CardPurchaseErrorCode.ACCOUNT_LOCKED:
        response.message = 'Tài khoản bị khóa'
        break
      case CardPurchaseErrorCode.MERCHANT_WRONG_IP:
        response.message = 'Merchant sai IP đăng ký'
        break
      case CardPurchaseErrorCode.MERCHANT_INACTIVE:
        response.message = 'Merchant không hoạt động'
        break
      case CardPurchaseErrorCode.WRONG_SIGNATURE:
        response.message = 'Sai chữ ký'
        break
      case CardPurchaseErrorCode.MISSING_COMMAND_PARAMETER:
        response.message = 'Yêu cầu không đúng. Thiếu tham số command'
        break
      case CardPurchaseErrorCode.PRODUCT_OUT_OF_STOCK:
        response.message = 'Sản phẩm này đã hết'
        break
      case CardPurchaseErrorCode.IP_NOT_ALLOWED:
        response.message = 'Địa chỉ IP không được quyền truy cập'
        break
      case CardPurchaseErrorCode.EXCEPTION_ERROR:
        response.message = 'Lỗi Exception'
        break
      case CardPurchaseErrorCode.PAYMENT_FAILED:
        response.message = 'Thanh toán thất bại'
        break
      case CardPurchaseErrorCode.PURCHASE_FAILED:
        response.message = 'Không mua được hàng'
        break
      case CardPurchaseErrorCode.INVALID_PRODUCT_PRICE:
        response.message = 'Giá sản phẩm không đúng'
        break
      case CardPurchaseErrorCode.ORDER_FAILED_LIMIT_REACHED:
        response.message = 'Đơn hàng thất bại vì bị giới hạn'
        break
      case CardPurchaseErrorCode.INVALID_QUANTITY:
        response.message = 'Số lượng không hợp lệ'
        break
      case CardPurchaseErrorCode.QUANTITY_MUST_BE_POSITIVE:
        response.message = 'Số lượng phải là số nguyên dương'
        break
      default:
        response.message = result.message || 'Lỗi không xác định'
    }

    return response
  }

  /**
   * Purchase cards - Based on the API documentation
   * @param serviceCode - Service code (Viettel, Mobifone, etc.)
   * @param value - Card value in VND
   * @param quantity - Number of cards to purchase
   * @param requestId - Request ID for tracking the purchase
   * @returns Promise with the purchase response
   */
  async purchaseCards(
    serviceCode: string,
    value: number,
    quantity: number,
    requestId: string = Math.floor(Math.random() * 900000000 + 100000000).toString(),
  ): Promise<StandardResponse> {
    try {
      // First, check if cards are available
      const availabilityCheck = await this.checkAvailability(serviceCode, value, quantity)

      if (!availabilityCheck.success) {
        return {
          success: false,
          status: CardPurchaseErrorCode.PRODUCT_OUT_OF_STOCK,
          message: 'Sản phẩm này đã hết',
          data: null,
        }
      }

      // Generate signature for the API request
      const sign = this.generateSignature('purchase', requestId)

      // Construct the URL for the API request
      const url = `${this.apiUrl}?partner_id=${this.partnerId}&command=buycard&service_code=${serviceCode}&value=${value}&qty=${quantity}&request_id=${requestId}&sign=${sign}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = (await response.json()) as PurchaseResponse

      return this.processResponse(data)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error purchasing cards: ${error.message}`)
      }
      throw new Error('Unknown error purchasing cards')
    }
  }

  /**
   * Check card availability
   * @param serviceCode - Service code (Viettel, Mobifone, etc.)
   * @param value - Card value in VND
   * @param quantity - Number of cards to check
   * @returns Promise with the availability response
   */
  async checkAvailability(
    serviceCode: string,
    value: number,
    quantity: number,
  ): Promise<StandardResponse> {
    try {
      const url = `${this.apiUrl}?partner_id=${this.partnerId}&command=checkavailable&service_code=${serviceCode}&value=${value}&qty=${quantity}`

      const response = await fetch(url, {
        method: 'POST',
        redirect: 'follow',
      })

      const data = (await response.json()) as AvailabilityResponse

      return {
        success: data.stock_available,
        status: data.stock_available ? 1 : 0,
        message: data.message,
        data,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error checking card availability: ${error.message}`)
      }
      throw new Error('Unknown error checking card availability')
    }
  }

  /**
   * Redownload cards by order code
   * @param requestId - Original request ID
   * @param orderCode - Order code to redownload
   * @returns Promise with the redownload response
   */
  async redownloadCards(requestId: string, orderCode: string): Promise<StandardResponse> {
    try {
      const sign = this.generateSignature('redownload', requestId)

      const url = `${this.apiUrl}?partner_id=${this.partnerId}&command=redownload&request_id=${requestId}&order_code=${orderCode}&sign=${sign}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = (await response.json()) as RedownloadResponse

      return this.processResponse(data)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error redownloading cards: ${error.message}`)
      }
      throw new Error('Unknown error redownloading cards')
    }
  }

  /**
   * Get account balance
   * @param walletNumber - Optional wallet number
   * @returns Promise with the balance response
   */
  async getBalance(walletNumber?: string): Promise<StandardResponse> {
    try {
      const sign = this.generateSignature('getbalance', '')

      let url = `${this.apiUrl}?partner_id=${this.partnerId}&command=getbalance&sign=${sign}`
      if (walletNumber) {
        url += `&wallet_number=${walletNumber}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = (await response.json()) as BalanceResponse

      return {
        success: true,
        status: 1,
        message: 'Success',
        data,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error getting balance: ${error.message}`)
      }
      throw new Error('Unknown error getting balance')
    }
  }

  /**
   * Get list of available products
   * @returns Promise with the products response
   */
  async getProducts(): Promise<StandardResponse> {
    try {
      const url = `${this.apiUrl}/products?partner_id=${this.partnerId}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      return {
        success: true,
        status: 1,
        message: 'Success',
        data,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error getting products: ${error.message}`)
      }
      throw new Error('Unknown error getting products')
    }
  }
}

export const muaThe = new MuaThe(env.MUATHER_PARTNER_ID, env.MUATHER_PARTNER_KEY)

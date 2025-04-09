import { env } from '@/config'
import { transactions, users } from '@/payload-generated-schema'
import payloadConfig from '@payload-config'
import { eq, sql } from '@payloadcms/db-postgres/drizzle'
import CryptoJS from 'crypto-js'
import { getPayload } from 'payload'
import { after } from 'next/server'
import { discordWebhook } from './novu.service'
import { formatPrice } from '@/utilities/formatPrice'

/**
 * Enum for telco providers
 */
export enum TelcoProvider {
  VIETTEL = 'VIETTEL',
  MOBIFONE = 'MOBIFONE',
  VINAPHONE = 'VINAPHONE',
  VIETNAMOBILE = 'VIETNAMOBILE',
  ZING = 'ZING',
  GATE = 'GATE',
}

/**
 * Enum for card status codes
 */
export enum CardStatus {
  SUCCESS = 1,
  WRONG_AMOUNT = 2,
  INVALID_CARD = 3,
  MAINTENANCE = 4,
  PENDING = 99,
}

/**
 * Interface for raw API response
 */
export interface ApiResponse {
  status: number
  message?: string
  request_id?: number
  trans_id?: string
  declared_value?: number
  value?: number
  amount?: number
  code?: string
  serial?: string
  telco?: string
  [key: string]: any // For any additional fields
}

/**
 * Interface for standardized response after processing
 */
export interface StandardResponse {
  success: boolean
  status: number
  message: string
  data: ApiResponse
}

/**
 * Interface for fee information
 */
export interface FeeResponse {
  success: boolean
  data: Array<{
    telco: string
    value: number
    fees: number
    penalty: number
  }>
}

/**
 * Interface for callback data from DoiThe1s
 */
export interface CallbackData {
  status: number
  message?: string
  request_id: number
  trans_id?: string
  declared_value?: number
  value?: number
  amount?: number
  code: string
  serial: string
  telco: string
  callback_sign: string
  [key: string]: any // For any additional fields
}

/**
 * Interface for processed callback data
 */
export interface ProcessedCallbackData {
  status: number
  message?: string
  request_id: number
  trans_id?: string
  declared_value?: number
  value?: number
  amount?: number
  code: string
  serial: string
  telco: string
}

/**
 * Interface for API request data
 */
export interface PostData {
  request_id: number
  code: string
  partner_id: string
  serial: string
  telco: string
  amount: number
  command: 'charging' | 'check'
  sign: string
}

/**
 * Interface for webhook response
 */
export interface WebhookResponse {
  message: string
}

/**
 * DoiThe - A TypeScript class for integrating with DoiThe1s.vn API
 * This class supports both GET and POST methods for card charging operations
 */
export class DoiThe {
  private partnerId: string
  private partnerKey: string
  private apiUrl: string = 'https://doithe1s.vn/chargingws/v2'

  /**
   * Constructor for DoiThe class
   * @param partnerId - Partner ID from doithe1s.vn
   * @param partnerKey - Partner key from doithe1s.vn
   */
  constructor(partnerId: string, partnerKey: string) {
    this.partnerId = partnerId
    this.partnerKey = partnerKey
  }

  /**
   * Generate signature using MD5
   * @param pin - Card PIN
   * @param serial - Card serial number
   * @returns MD5 hash of partnerKey + pin + serial
   */
  private generateSignature(pin: string, serial: string): string {
    return CryptoJS.MD5(this.partnerKey + pin + serial).toString()
  }

  /**
   * Charge card using POST method
   * @param telco - Card provider (VIETTEL, MOBIFONE, VINAPHONE, etc.)
   * @param code - Card PIN
   * @param serial - Card serial number
   * @param amount - Card amount in VND
   * @param userId - User ID
   * @param customRequestId - Optional custom request ID
   * @returns Promise with the API response
   */
  async chargeCardPost(
    telco: string,
    code: string,
    serial: string,
    amount: number,
    userId: number,
    customRequestId?: number,
  ): Promise<StandardResponse> {
    const maxAttempts = 3
    let attempt = 0

    while (attempt < maxAttempts) {
      try {
        const payload = await getPayload({ config: payloadConfig })
        const requestId = customRequestId || Math.floor(Math.random() * 900000000) + 100000000
        const _recharge = await payload.create({
          collection: 'recharges',
          data: {
            gateway: 'DOITHE',
            orderCode: requestId.toString(),
            amount,
            user: userId,
            status: 'PENDING',
            data: {
              telco,
              code,
              serial,
              requestId,
            },
          },
        })
        const signature = this.generateSignature(code, serial)

        const postData: PostData = {
          request_id: requestId,
          code,
          partner_id: this.partnerId,
          serial,
          telco,
          amount,
          command: 'charging',
          sign: signature,
        }

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        })
        const data = (await response.json()) as ApiResponse

        return this.processResponse(data)
      } catch (error) {
        attempt++
        if (attempt >= maxAttempts) {
          if (error instanceof Error) {
            throw new Error(
              `Error charging card via POST after ${maxAttempts} attempts: ${error.message}`,
            )
          }
          throw new Error(`Unknown error charging card via POST after ${maxAttempts} attempts`)
        }
      }
    }
    // This should never be reached due to the throw in the catch block
    throw new Error('Unexpected error in chargeCardPost')
  }

  /**
   * Check card status using POST method
   * @param telco - Card provider (VIETTEL, MOBIFONE, VINAPHONE, etc.)
   * @param code - Card PIN
   * @param serial - Card serial number
   * @param amount - Card amount in VND
   * @param requestId - Request ID of the card to check
   * @returns Promise with the API response
   */
  async checkCardStatusPost(
    telco: string,
    code: string,
    serial: string,
    amount: number,
    requestId: number,
  ): Promise<StandardResponse> {
    try {
      const signature = this.generateSignature(code, serial)

      const postData: PostData = {
        request_id: requestId,
        code,
        partner_id: this.partnerId,
        serial,
        telco,
        amount,
        command: 'check',
        sign: signature,
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })
      const data = (await response.json()) as ApiResponse

      return this.processResponse(data)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error checking card status via POST: ${error.message}`)
      }
      throw new Error('Unknown error checking card status via POST')
    }
  }

  /**
   * Get card exchange fees
   * @returns Promise with the card exchange fees for all telcos
   */
  async getFees(): Promise<FeeResponse> {
    try {
      const url = `${this.apiUrl}/getfee?partner_id=${this.partnerId}`

      const response = await fetch(url, { next: { revalidate: 60 } })
      const data = await response.json()

      return {
        success: true,
        data,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error getting card fees: ${error.message}`)
      }
      return {
        success: false,
        data: [],
        message: 'Unknown error occurred while getting card fees',
      } as unknown as FeeResponse
    }
  }

  /**
   * Process the API response and return standardized result
   * @param result - API response
   * @returns Standardized result object
   */
  private processResponse(result: ApiResponse): StandardResponse {
    const response: StandardResponse = {
      success: false,
      status: result.status,
      message: result.message || '',
      data: result,
    }

    switch (result.status) {
      case CardStatus.SUCCESS:
        response.success = true
        response.message = 'Nạp thẻ thành công'
        break
      case CardStatus.WRONG_AMOUNT:
        response.message = 'Sai mệnh giá thẻ'
        break
      case CardStatus.INVALID_CARD:
        response.message = 'Vui lòng kiểm tra lại thẻ, thẻ không hợp lệ hoặc đã được sử dụng'
        break
      case CardStatus.MAINTENANCE:
        response.message = 'Hệ thống bảo trì'
        break
      case CardStatus.PENDING:
        response.success = true
        response.message = 'Gửi thẻ thành công, đang chờ xử lý'
        break
      default:
        response.message = result.message || 'Lỗi không xác định'
    }

    return response
  }

  /**
   * Verify callback signature from DoiThe1s
   * @param code - Card PIN
   * @param serial - Card serial number
   * @param callbackSign - Callback signature from DoiThe1s
   * @returns Boolean indicating if signature is valid
   */
  verifyCallbackSignature(code: string, serial: string, callbackSign: string): boolean {
    const signature = CryptoJS.MD5(this.partnerKey + code + serial).toString()
    return signature === callbackSign
  }

  /**
   * Process callback data from DoiThe1s
   * @param callbackData - Callback data from DoiThe1s
   * @returns Processed callback data if signature is valid, null otherwise
   */
  processCallback(callbackData: CallbackData): ProcessedCallbackData | null {
    try {
      // For GET method callback (query parameters)
      if (
        typeof callbackData === 'object' &&
        'code' in callbackData &&
        'serial' in callbackData &&
        'callback_sign' in callbackData
      ) {
        const isValid = this.verifyCallbackSignature(
          callbackData.code,
          callbackData.serial,
          callbackData.callback_sign,
        )

        if (isValid) {
          return {
            status: callbackData.status,
            message: callbackData.message,
            request_id: callbackData.request_id,
            trans_id: callbackData.trans_id,
            declared_value: callbackData.declared_value,
            value: callbackData.value,
            amount: callbackData.amount,
            code: callbackData.code,
            serial: callbackData.serial,
            telco: callbackData.telco,
          }
        }
      }

      return null
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error processing callback: ${error.message}`)
      }
      throw new Error('Error processing callback')
    }
  }

  /**
   * Handle webhook from DoiThe1s
   * @param data - Webhook data from DoiThe1s
   * @returns Response message
   */
  async webhookHandle(data: CallbackData): Promise<WebhookResponse> {
    try {
      // Process and validate the callback data
      const callbackData = this.processCallback(data)
      if (!callbackData || !callbackData.request_id) {
        console.error('Invalid callback data:', data)
        return { message: 'Invalid callback data' }
      }

      const payload = await getPayload({ config: payloadConfig })
      const { docs } = await payload.find({
        collection: 'recharges',
        where: {
          orderCode: { equals: callbackData.request_id.toString() },
          gateway: { equals: 'DOITHE' },
        },
        depth: 0,
      })

      const recharge = docs[0]
      if (!recharge) {
        console.error('Recharge not found for request_id:', callbackData.request_id)
        return { message: 'Recharge not found' }
      }

      if (recharge.status === 'SUCCESS') {
        return { message: 'Recharge already success' }
      }

      // Update recharge status based on the callback status
      let newStatus = 'PENDING'
      if (
        callbackData.status === CardStatus.SUCCESS ||
        callbackData.status === CardStatus.WRONG_AMOUNT
      ) {
        newStatus = 'SUCCESS'
      } else if (
        callbackData.status === CardStatus.INVALID_CARD ||
        callbackData.status === CardStatus.MAINTENANCE
      ) {
        newStatus = 'CANCEL'
      }

      // Update the recharge record
      await payload.update({
        collection: 'recharges',
        where: { id: { equals: recharge.id } },
        data: {
          status: newStatus as 'PENDING' | 'CANCEL' | 'SUCCESS' | 'REFUND',
          data: {
            ...(typeof recharge.data === 'object' && recharge.data !== null ? recharge.data : {}),
            callbackData,
          },
        },
        depth: 0,
      })

      // If the recharge is successful, update user balance and create transaction
      if (newStatus === 'SUCCESS') {
        const amount = callbackData.amount || callbackData.value || 0
        await payload.db.drizzle.transaction(async (tx) => {
          const [user] = await tx
            .update(users)
            .set({ balance: sql`${users.balance} + ${amount}` })
            .where(eq(users.id, recharge.user as number))
            .returning({ balance: users.balance })

          if (!user || user.balance === null) {
            console.error('User not found:', recharge.user)
            throw new Error('User not found')
          }

          await tx.insert(transactions).values({
            amount: amount.toString(),
            user: recharge.user as number,
            description: `Nạp thẻ ${callbackData.telco} serial #${callbackData.serial} ${callbackData.status == CardStatus.WRONG_AMOUNT ? 'phạt 50% sai mệnh giá' : ''}`,
            balance: user.balance,
          })
        })

        after(async () => {
          await discordWebhook({
            subject: `Nạp Thẻ ${callbackData.telco}`,
            message: `Người dùng: ID ${recharge.user} \nSố tiền: **${formatPrice(amount)}** \nSerial: **${callbackData.serial}** ${
              callbackData.status == CardStatus.WRONG_AMOUNT ? '\n**Phạt 50% sai mệnh giá**' : ''
            }`,
            color: '#00FF00',
            channel: 'activities',
          })
        })
      }

      return { message: 'ok' }
    } catch (error) {
      console.error('Error in webhookHandle:', error)
      if (error instanceof Error) {
        return { message: `Error: ${error.message}` }
      }
      return { message: 'Unknown error occurred' }
    }
  }
}

const doiThe = new DoiThe(env.DOITHE_PARTNER_ID, env.DOITHE_PARTNER_KEY)
export default doiThe

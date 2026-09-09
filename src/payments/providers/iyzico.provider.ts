import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import Iyzipay from 'iyzipay';

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  enabled: boolean;
}

export interface IyzicoBasketItem {
  id: string;
  name: string;
  price: number;
}

export interface IyzicoCheckoutParams {
  conversationId: string;
  basketId: string;
  price: number;
  currency: string;
  callbackUrl: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    identityNumber: string;
    email: string;
    gsmNumber: string;
    registrationAddress: string;
    city: string;
    country: string;
    zipCode: string;
    ip: string;
  };
  address: { contactName: string; address: string; city: string; country: string; zipCode: string };
  basketItems: IyzicoBasketItem[];
}

export interface IyzicoCheckoutResult {
  status: string;
  paymentPageUrl?: string;
  token?: string;
  errorMessage?: string;
}

export interface IyzicoRetrieveResult {
  status: string;
  paymentStatus?: string;
  basketId?: string;
  paidPrice?: string;
  errorMessage?: string;
  raw: unknown;
}

// iyzico'nun resmi SDK'sı callback tabanlı — burada Promise'e sarıyoruz.
@Injectable()
export class IyzicoProvider {
  private client(config: IyzicoConfig) {
    return new Iyzipay({ apiKey: config.apiKey, secretKey: config.secretKey, uri: config.baseUrl });
  }

  initializeCheckoutForm(config: IyzicoConfig, params: IyzicoCheckoutParams): Promise<IyzicoCheckoutResult> {
    const client = this.client(config);
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: params.conversationId,
      price: params.price.toFixed(2),
      paidPrice: params.price.toFixed(2),
      currency: params.currency,
      basketId: params.basketId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: params.callbackUrl,
      enabledInstallments: [1],
      buyer: params.buyer,
      shippingAddress: params.address,
      billingAddress: params.address,
      basketItems: params.basketItems.map((item) => ({
        id: item.id,
        name: item.name,
        category1: 'El İşi Ürün',
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: item.price.toFixed(2),
      })),
    };

    return new Promise((resolve, reject) => {
      client.checkoutFormInitialize.create(request, (err: unknown, result: IyzicoCheckoutResult) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  retrieveCheckoutForm(config: IyzicoConfig, token: string): Promise<IyzicoRetrieveResult> {
    const client = this.client(config);
    const request = { locale: Iyzipay.LOCALE.TR, token };

    return new Promise((resolve, reject) => {
      client.checkoutForm.retrieve(request, (err: unknown, result: IyzicoRetrieveResult & Record<string, unknown>) => {
        if (err) reject(err);
        else resolve({ ...result, raw: result });
      });
    });
  }
}

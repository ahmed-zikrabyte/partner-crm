import QRCode from "qrcode";

export class QRCodeUtil {
  static async generateDeviceQRCode(device: any): Promise<string> {
    const deviceUrl = `${process.env.CLIENT_URL}/qr/device/${device._id}`;

    return await QRCode.toDataURL(deviceUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  }
}

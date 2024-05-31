import fs from 'fs-extra';
import usb from 'usb';
import usbDetect from 'usb-detection';
import os from 'os';

class PicoController {
  device = null;
  endpoint = null;

  constructor() {
    if (os.platform() === 'win32') {
      usb.useUsbDkBackend();
    }
  }

  async findPico() {
    const devices = usb.getDeviceList();
    usbDetect.startMonitoring();

    for (const device of devices) {
      console.log('CHECKING DEVICE', device.deviceDescriptor.idVendor, device.deviceDescriptor.idProduct);
      if (this.isPico(device)) {
        this.device = device;
        try {
          await this.openDevice();
          return true;
        } catch (error) {
          console.error('Error opening device:', error);
          return false;
        }
      }
    }
    return false;
  }

  isPico(device) {
    return device.deviceDescriptor.idVendor === 0x2e8a && device.deviceDescriptor.idProduct === 0x0005;
  }

  async openDevice() {
    return new Promise((resolve, reject) => {
      try {
        this.device.open();
        this.device.interfaces[0].claim();
        this.endpoint = this.device.interfaces[0].endpoints[0];
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async powerCycleUSB() {
    if (!this.device) {
      throw new Error('Pico not connected.');
    }

    const devicePath = this.device.busNumber + ':' + this.device.deviceAddress;

    // Disable the device
    usbDetect.stopMonitoring();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Enable the device
    usbDetect.startMonitoring();

    await new Promise((resolve, reject) => {
      usbDetect.on('add', (device) => {
        if (device.deviceAddress === devicePath) {
          resolve();
        }
      });
    });
  }

  async restartInFSMode() {
    await this.powerCycleUSB();
    // Wait a few seconds for the device to reinitialize
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Now the Pico should be in FS mode if the BOOTSEL button was pressed programmatically
    await this.findPico();
  }

  async loadUF2(uf2Path) {
    if (!this.device) {
      throw new Error('Pico not found.');
    }

    const uf2Data = await fs.readFile(uf2Path);
    await this.writeToPico(uf2Data);
  }

  async sendPyFile(pyFilePath) {
    if (!this.device) {
      throw new Error('Pico not found.');
    }

    const pyData = await fs.readFile(pyFilePath);
    await this.writeToPico(pyData);
  }

  async writeToPico(data) {
    return new Promise((resolve, reject) => {
      this.endpoint.transfer(data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}


export default PicoController
import sys, hashlib
from bitcoin.rpc import RawProxy

proxy_connection=RawProxy() # This reverses and then swaps every other char

def swap_order(param):
    byte_array = bytearray.fromhex(param)
    byte_array.reverse()
    return(''.join(format(x, '02x') for x in byte_array))
 # Get the block hash of block with height 277316

def main():
   blockhash = proxy_connection.getblockhash(int(sys.argv[1]))
   # Retrieve the block by its hash
   block = proxy_connection.getblock(blockhash)
      # Element tx contains the list of all transaction IDs in the block
   header = (swap_order(block['versionHex']) \
      + swap_order(block['previousblockhash']) \
      + swap_order(block['merkleroot']) \
      + swap_order('{:00x}'.format(block['time'])) \
      + swap_order(block['bits']) \
      +  swap_order('{:00x}'.format(block['nonce'])))

   header_bin = header.decode('hex')
   hash = hashlib.sha256(hashlib.sha256(header_bin).digest()).digest()
   hashenc = hash[::-1].encode('hex_codec')
   print(hashenc)
   if hashenc==block['hash']:
      print('hashas teisingas')

if __name__ == "__main__":
   main()
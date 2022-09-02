/* global BigInt */
import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Switch from '@material-ui/core/Switch';
import extjs from '../ic/extjs.js';
import {StoicIdentity} from '../ic/identity.js';
import {validatePrincipal, validateAddress} from '../ic/utils.js';
import {compressAddress} from '../utils.js';
import { useSelector } from 'react-redux'
import { sendDipToken, getTokenBalance,  } from '../hooks/useDip20.js';

export default function SendFormDAB(props) {
  const addresses = useSelector(state => state.addresses);
  const principals = useSelector(state => state.principals);
  const currentPrincipal = useSelector(state => state.currentPrincipal);
  const currentAccount = useSelector(state => state.currentAccount)
  const identity = useSelector(state => (state.principals.length ? state.principals[currentPrincipal].identity : {}));
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [balance, setBalance] = React.useState(props.balance);

  const [amount, setAmount] = React.useState(0);
  const [to, setTo] = React.useState('');
  const [toOption, setToOption] = React.useState('');
  
  const [advanced, setAdvanced] = React.useState(false);
  const [memo, setMemo] = React.useState('');
  const [notify, setNotify] = React.useState(false);
  
  const [contacts, setContacts] = React.useState([]);
  const [fee, setFee] = React.useState(0);
  const [minFee, setMinFee] = React.useState(props.minFee);
  
  const error = (e) => {
    console.log(e)
    props.alert(e);
  }
  const review = () => {
    console.log(amount, fee, minFee, balance)

    if (isNaN(amount)) return error("Please enter a valid amount to send");
    if (isNaN(fee)) return error("Please enter a valid fee to use");
    if ((Number(amount)+Number(fee)) > props.balance)  return error("You have insufficient token balance"); 
    if (fee !== minFee) return error("The fee must be " + minFee);
    setStep(1);
  }
  const submit = async () => {
    //Submit to blockchain here
    var _from_principal = identity.principal;
    var _to_user = to;
    var _amount = Math.floor( amount * Math.pow(10, props.decimals) ) ;
    var _memo = memo;
    var _notify = notify;
    
    props.loader(true);

    //Load signing ID
    const id = StoicIdentity.getIdentity(identity.principal);
    if (!id) return error("Something wrong with your wallet, try logging in again");


    setOpen(false);


    console.log("token: ", props.token, "\nidentity: ", identity, "to user: ", to, "from principal", _from_principal, "amount: ", _amount)
    let res =  await sendDipToken(props.token, identity, _to_user, _from_principal, _amount )
   
    if (res.transactionId)
    {
      props.alert("Sent " + _amount + " to " + to);
    }
    else
    {
      props.alert("Transaction failed");
    }
   

    handleClose()
    props.loader(false);
    props.setChildRefresh(props.childRefresh+1);
   

    
    
  };
  const handleClick = () => {
    setOpen(true);
  
  };
  const handleClose = () => {
    setOpen(false);
    setStep(0);
    setAmount(0);
    setBalance(false);
    setTo('');
    setToOption('');
    setAdvanced(false);
    setMemo('');
    setNotify(false);
  };

  // React.useEffect(() => {
    
  //   var contacts = [];
  //   principals.forEach(p => {
  //     p.accounts.forEach(a => {
  //       contacts.push({
  //         group : p.identity.principal,
  //         name : a.name,
  //         address : a.address,
  //       });
  //     });
  //   });
  //   setContacts(contacts);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [props.token, open]);

  return (
    <>
      {React.cloneElement(props.children, {onClick: handleClick})}
      <Dialog open={open} onClose={handleClose}  maxWidth={'sm'} fullWidth >
        <DialogTitle id="form-dialog-title" style={{textAlign:'center'}}>Send {props.token.name} Tokens</DialogTitle>
        {step === 0 ?
          <DialogContent>
            <DialogContentText style={{textAlign:'center',fontWeight:'bold'}}>Please enter the recipient principal and amount of {props.token.name} that you wish to send below.</DialogContentText>
            <>
              <Autocomplete
                freeSolo
                value={toOption}
                onChange={(e,v) => { if (v) {
                    setTo(v.group) 
                    setToOption(v.group) 
                  }
                }}
                inputValue={to}
                onInputChange={(e,v) => setTo(v)}
                getOptionLabel={contact => contact.name || contact}
                groupBy={(contact) => contact.group}
                options={contacts}
                renderInput={(params) => (
                    <TextField
                    {...params}
                    autoFocus
                    margin="dense"
                    label="Principal of the Recipient"
                    type="text"
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                )}
              />
              
              <TextField
                style={{width:'49%', marginRight:'2%'}}
                margin="dense"
                label={"Amount of " + props.token.name + " to Send"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="text"
                InputLabelProps={{
                  shrink: true,
                }}
              />
              { minFee > -1 ?
              <TextField
                style={{width:'49%'}}
                margin="dense"
                label="Fee"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                type="text"
                InputLabelProps={{
                  shrink: true,
                }}
              /> : "" }

              <DialogContentText style={{fontSize:'small',textAlign:'center', marginTop:"20px"}}>
                { balance !== false ? "Balance: "+balance+" "+props.token.name +" ": ""}
              </DialogContentText>
            </>
          </DialogContent>
        :
          <DialogContent>
            <DialogContentText style={{textAlign:'center'}}>
            Please confirm that you are about to send <br />
            <strong style={{color:'red'}}>{amount} {props.token.name}</strong><br /> 
            from <strong style={{color:'red'}}>{compressAddress(props.address)}</strong><br />
            to <strong style={{color:'red'}}>{compressAddress(to)}</strong><br />
            </DialogContentText>
            <DialogContentText style={{textAlign:'center'}}>
              <strong>All transactions are irreversible, so ensure the above details are correct before you continue.</strong>
            </DialogContentText>
          </DialogContent>
        }
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          {step === 0 ?
            <Button onClick={review} color="primary">Review Transaction</Button>
            :
            <Button onClick={submit} color="primary">Confirm Transaction</Button>
          }
        </DialogActions>
      </Dialog>
    </>
  );
}

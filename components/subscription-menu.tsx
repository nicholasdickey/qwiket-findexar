//@ts-ignore
import {Gate} from "use-stripe-subscription";


interface Props {
    products: any[];
    redirectToCheckout:any;
    redirectToCustomerPortal:any;
    setDismiss:any;
    hardStop:boolean;
}
const SubscriptionMenu = ({hardStop,setDismiss,products,redirectToCheckout,redirectToCustomerPortal}:Props) => {
    return <div style={{paddingTop:40}} >
       <p>Utilizing AI technology, and specifically the OpenAI service, for the in-depth analysis and processing of media content to track athletes and teams, is critical for our operations. This sophisticated technology, which comes with relatively high costs, enables us to slice and dice published articles to provide concise, time-saving summaries of mentions, giving our Fantasy Sports users a distinct competitive advantage.</p>

<p>Findexar offers insights on par with those from high-end agencies like Nielsen, which typically cost professional teams and agencies tens of thousands of dollars monthly, but at a far more accessible price point.</p>

<p>To maintain this high-quality service, Findexar&apos;s subscription is competitively priced at just $10 per month or $100 for an annual plan. </p>
<h2>Plans</h2>
      {products&&products.map(({ product, prices }: { product: any, prices: any[] }) => (
        <div key={product.id}>
          <h4>{product.name}</h4>
          <Gate unsubscribed>
            {prices.map((price:any) => (
              <div 
                key={price.id}
                onClick={() => redirectToCheckout({ price: price.id })}
              >
                Subscribe ${price.unit_amount/100}/{price.recurring.interval} 
              </div>
            ))}
          </Gate>
          <Gate product={product}>Active plan</Gate>
          <Gate product={product} negate>
            <button onClick={() => redirectToCustomerPortal()}>
              Change plan
            </button>
          </Gate>
          <br/>
        </div>
        
      ))}
      <br/>
       {!hardStop&&<button   onClick={() => setDismiss(true)}>Dismiss</button>}
      </div>
}
export default SubscriptionMenu;